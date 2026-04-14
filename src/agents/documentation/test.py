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
    if not os.getenv("AWS_REGION"):
        print("ERROR: AWS_REGION not found in .env", file=sys.stderr)
        sys.exit(1)

    region = os.getenv("AWS_REGION", "eu-north-1")
    os.environ["AWS_DEFAULT_REGION"] = region
    os.environ["AWS_REGION"] = region

    if not os.getenv("AGENT_MODEL_ID"):
        print("ERROR: AGENT_MODEL_ID not found in .env", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) > 1:
        repo_path = sys.argv[1]
    else:
        print("Usage: python test.py <repo_path>", file=sys.stderr)
        sys.exit(1)

    xml_content = run_repomix(repo_path)

    agent = Agent(
        system_prompt="""
You are an expert Software Engineering Quality Assurance agent.

## CONTEXT
You receive the full XML output of a repository analyzed by repomix, plus the local filesystem path of that repository.
Your goal is to produce a comprehensive inconsistency report between the documentation and the actual source code.

## MANDATORY WORKFLOW — follow these steps IN ORDER before generating output

1. **Parse** the repomix XML: extract file tree, file contents, dependencies, configs.
2. **Read all documentation** (README*, CHANGELOG*, docs/, wiki/, *.md, *.rst, *.txt).
3. **Run Spectral** using the `spectral_analyze_repo` tool, passing the `repo_path` value provided in the user message.
   - You MUST call the tool — skipping it is NOT allowed.
   - If the tool returns an error, include it in `API_standard_violations` with severity "error".
4. **Cross-check** documentation claims against:
   - Actual file tree (missing/extra files, wrong paths)
   - Declared vs installed dependencies (package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod, pom.xml, build.gradle…)
   - Version numbers (Node, Python, Docker image tags, library versions)
   - Environment variables (documented vs actually referenced in code)
   - API endpoints / routes (documented vs implemented)
   - Architecture diagrams / described components vs actual modules
   - CI/CD pipeline steps described vs .github/workflows or equivalent
5. **Generate** the JSON report.

## OUTPUT RULES
- Return ONLY a valid JSON object.
- No markdown fences, no prose before or after the JSON.
- The JSON must start with `{` and end with `}`.
- All string values inside the JSON must be properly escaped.
- Do not truncate the output.
- Response must be in english

## OUTPUT SCHEMA
{
  "analysis_report": {
    "API_standard_violations": [
      {
        "file": "string",
        "rule": "string",
        "severity": "error | warning | info | hint",
        "message": "string",
      }
    ],
    "docs_discrepancies": [
      {
        "category": "VERSION | DEPENDENCY | FILE_PATH | ENV_VAR | API_ENDPOINT | ARCHITECTURE | CI_CD | CONFIG | OTHER",
        "documentation_source": "string",
        "docs_claim": "string", #like "the readme says we have a file called X that does Y" or "the swagger api doc describes an endpoint POST /widgets that accepts a JSON body with these fields and returns 200 with this response"
        "actual_finding": "string", #in relation to the claim e.g. if is claimed that a file exists does something and it doesn't, the actual finding could be "the file X does this and it doesn't do that"
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      }
    ],
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
}
""",
        model=os.getenv("AGENT_MODEL_ID"),
        tools=[spectral_analyze_repo],
    )

    prompt = f"""
repo_path: {repo_path}

Parse the following XML content from the repository and produce the JSON report following the required workflow.
Remember: Call the spectral_analyze_repo tool FIRST with repo_path="{repo_path}", than generate the JSON.

<repomix_xml>
{xml_content}
</repomix_xml>
"""

    try:
        response = agent(prompt)

        raw_text = get_response_text(response)

        if not raw_text.strip():
            raise ValueError("The model response is empty.")

        clean_json = extract_json(raw_text)
        report_data = json.loads(clean_json)

        output_path = "analysis-report.json"
        print(json.dumps(report_data, indent=2, ensure_ascii=False))

    except json.JSONDecodeError as e:
        print(f"[JSON ERROR] Parsing failed: {e}", file=sys.stderr)
        print(f"[RAW RESPONSE]\n{raw_text[:2000]}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    run_documentation_analysis()