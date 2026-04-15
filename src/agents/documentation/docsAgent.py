import sys
import os
import json
import re
import subprocess
import tempfile
from dotenv import load_dotenv
from strands import Agent, tool
from tools.spectral import spectral_analyze_repo


def run_repomix(repo_path: str) -> str:
    """
    Run repomix on the given repository path and return the XML output content.
    Writes the output to a temporary file, reads it, then cleans up.
    """
    with tempfile.NamedTemporaryFile(suffix=".xml", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            ["repomix", "--output", tmp_path, "--style", "xml", repo_path],
            capture_output=True,
            text=True,
            check=True,
        )
        with open(tmp_path, "r", encoding="utf-8") as f:
            return f.read()
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] repomix failed:\n{e.stderr}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print("[ERROR] repomix is not installed or not in PATH.", file=sys.stderr)
        sys.exit(1)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def extract_json(text: str) -> str:
    """
    Extract the first valid JSON block from the model response,
    stripping markdown fences and formatting.
    """
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1).strip()

    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON found in the model response.")

    depth = 0
    for i, ch in enumerate(text[start:], start=start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    raise ValueError("JSON not balanced in the model response.")


def get_response_text(response) -> str:
    """
    Extract the text content from the response, handling different possible structures known in the SDK.
    """
    if hasattr(response, "message"):
        msg = response.message

        if isinstance(msg, str) and msg.strip():
            return msg

        if isinstance(msg, dict):
            parts = msg.get("content", [])
            if isinstance(parts, list):
                text = "".join(
                    p.get("text", "")
                    for p in parts
                    if isinstance(p, dict) and p.get("type") == "text"
                )
                if text.strip():
                    return text

            if isinstance(parts, str) and parts.strip():
                return parts

    if hasattr(response, "content"):
        content = response.content

        if isinstance(content, str) and content.strip():
            return content
        if isinstance(content, list):
            text = "".join(
                p.get("text", "")
                for p in content
                if isinstance(p, dict) and p.get("type") == "text"
            )
            if text.strip():
                return text

    for attr in ("output", "result", "text", "response"):
        if hasattr(response, attr):
            val = getattr(response, attr)
            if isinstance(val, str) and val.strip():
                return val

    return str(response)  # fallback


def run_documentation_analysis():
    load_dotenv()
    region = os.getenv("AWS_REGION", "eu-north-1")
    os.environ["AWS_DEFAULT_REGION"] = region
    os.environ["AWS_REGION"] = region

    model_id = os.getenv("AGENT_MODEL_ID")
    if not model_id or len(sys.argv) <= 1:
        print("ERROR: Missing AGENT_MODEL_ID or repo_path", file=sys.stderr)
        sys.exit(1)

    repo_path = sys.argv[1]
    xml_content = run_repomix(repo_path)

    
    optimized_system_prompt = """Expert QA Agent. Compare documentation vs source code.
    
    CRITICAL WORKFLOW:
    1. Call `spectral_analyze_repo(repo_path="{repo_path}")` to do the study on the API standard violations
    2. Audit XML content: Cross-check README/docs against file tree, dependencies, API routes, and env vars.
    3. Return ONLY a JSON report. No markdown, no prose. Fill ALL sections of the report based on findings. ONLY if no issues, return empty arrays. THe API_standard_violations must be filled from the tool response
    the other sections must be filled based on the analysis of the XML content and the repo structure. Do not leave any section empty if you have information to fill it. If you don't have 
    information to fill a section, return an empty array for that section.

    SCHEMA:
    {
      "analysis_report": {
        "API_standard_violations": [{
            "file": "str", 
            "rule": "str", 
            "severity": "LOW|MEDIUM|HIGH|CRITICAL", 
            "message": "str"
        }],
        "docs_discrepancies": [{
            "category": "VERSION|DEPENDENCY|FILE_PATH|ENV_VAR|API_ENDPOINT|ARCHITECTURE|CI_CD|CONFIG|OTHER", 
            "documentation_source": "str", 
            "docs_claim": "str", 
            "actual_finding": "str", 
            "severity": "LOW|MEDIUM|HIGH|CRITICAL"
        }],
    "missing_files": [
      {
        "referenced_path": "string",
        "referenced_in": "string",
        "context": "string",
        "status": "NOT_FOUND | POSSIBLY_RENAMED | WRONG_PATH"
      }
    ],
    "dependency_audit": {
      "readme_defined": [{ "name": "string", "version_claimed": "string | null" }],
      "config_defined": [{ "name": "string", "version_pinned": "string | null", "source_file": "string" }],
      "missing_in_config": [{ "name": "string", "documented_in": "string", "severity": "LOW | MEDIUM | HIGH" }],
      "undocumented_in_readme": [{ "name": "string", "found_in": "string" }],
      "version_mismatches": [{ "name": "string", "readme_version": "string", "config_version": "string", "source_file": "string" }]
    },
  }
}""".replace("{repo_path}", repo_path)

    agent = Agent(
        system_prompt=optimized_system_prompt,
        model=model_id,
        tools=[spectral_analyze_repo],
    )

    # Prompt utente minimale per ridurre i token di input
    prompt = f"Analyze repository at: {repo_path}\n\n<repomix_xml>\n{xml_content}\n</repomix_xml>"

    try:
        response = agent(prompt)
        raw_text = get_response_text(response)

        if not raw_text.strip():
            raise ValueError("Empty response from model.")

        clean_json = extract_json(raw_text)
        report_data = json.loads(clean_json)

        print(json.dumps(report_data, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    run_documentation_analysis()