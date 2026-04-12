import sys
import json
import os
import re
from dotenv import load_dotenv
from strands import Agent

from tools.static_analysis_js_ts import js_ts_static_analysis
from tools.coverage_js_ts import js_ts_coverage_analysis
from tools.static_analysis_python import python_static_analysis
from tools.coverage_python import python_coverage_analysis
from tools.static_analysis_java import java_static_analysis
from tools.coverage_java import java_coverage_analysis

def detect_project_info(target_dir: str) -> tuple[str, str]:
    for root, dirs, files in os.walk(target_dir):
        if "node_modules" in dirs: dirs.remove("node_modules")
        if ".git" in dirs: dirs.remove(".git")
        if "target" in dirs: dirs.remove("target")
        if "venv" in dirs: dirs.remove("venv")
        if ".venv" in dirs: dirs.remove(".venv")

        if "pom.xml" in files:
            return "java", root
        if "package.json" in files:
            return "javascript/typescript", root

    for root, dirs, files in os.walk(target_dir):
        if "node_modules" in dirs: dirs.remove("node_modules")
        if ".git" in dirs: dirs.remove(".git")
        
        if "requirements.txt" in files or "setup.py" in files or "pyproject.toml" in files:
            return "python", root

    for root, dirs, files in os.walk(target_dir):
        if any(f.endswith(".py") for f in files):
            return "python", target_dir

    raise ValueError("Unsupported language or project structure not recognized.")

STATIC_TOOLS = {
    "python": python_static_analysis,
    "javascript/typescript": js_ts_static_analysis,
    "java": java_static_analysis
}

COVERAGE_TOOLS = {
    "python": python_coverage_analysis,
    "javascript/typescript": js_ts_coverage_analysis,
    "java": java_coverage_analysis
}

def build_agent_payload(static: dict, coverage: dict) -> dict:
    payload = {}

    if static.get("status") == "error":
        payload["static_analysis_tool_error"] = static.get("message")
    elif isinstance(static, dict) and "issues" in static:
        issues = static.get("issues", [])
        payload["static_analysis_report"] = {
            "language": static.get("language"),
            "tool": static.get("tool"),
            "total": static.get("total"),
            "issues": issues[:50],
            "visible_issues": len(issues[:50])
        }

    if coverage.get("status") == "error":
        payload["coverage_tool_error"] = coverage.get("message")
    elif isinstance(coverage, dict) and "files" in coverage:
        files = coverage.get("files", [])
        sorted_files = sorted(files, key=lambda f: f.get("line_coverage_pct", 0))

        payload["coverage_report"] = {
            "language": coverage.get("language"),
            "tool": coverage.get("tool"),
            "overall_line_pct": coverage.get("overall_line_pct"),
            "overall_branch_pct": coverage.get("overall_branch_pct"),
            "overall_function_pct": coverage.get("overall_function_pct"),
            "files": sorted_files[:50],
            "uncovered_files": coverage.get("uncovered_files", [])[:25]
        }

    return payload

SYSTEM_PROMPT = """
You are a Senior Code Quality Analyst.

INPUT FORMAT:
You will receive a JSON object containing `static_analysis_report` and `coverage_report`.

OUTPUT FORMAT:
Return ONLY a valid JSON object:
{
  "verdict": "Critical|Poor|Fair|Good|Excellent",
  "executive_summary": "Detailed technical overview",
  "static_analysis_evaluation": {
    "total_issues_analyzed": int,
    "key_issues_reasoning": [
      {
        "file": "string",
        "rule": "string",
        "severity": "string",
        "original_description": "string",
        "ai_reasoning": "Deep technical reasoning"
      }
    ]
  },
  "coverage_evaluation": {
    "overall_health": "string",
    "critical_files_reasoning": [
      {
        "file": "string",
        "line_coverage_pct": float,
        "missing_branches": int,
        "ai_reasoning": "Risk + testing strategy"
      }
    ]
  },
  "action_plan": [
    {"priority": 1, "action": "string", "reason": "string"}
  ]
}

STRICT RULES:
- total_issues_analyzed MUST equal static_analysis_report.total
- You MUST extract and analyze EXACTLY 10 distinct files in `critical_files_reasoning` (or all available if less than 5 are provided).
- You MUST extract and analyze EXACTLY 5 distinct issues in `key_issues_reasoning` (or all available if less than 5 are provided). Do NOT stop early.
- Use ONLY provided data. Do NOT hallucinate.
- Be highly technical. Mention undefined behavior, memory leaks, security, or branch risks based on the specific metrics.
"""

def safe_parse_ai_output(response: str):
    cleaned = re.sub(r"^```[a-zA-Z]*|```$", "", str(response)).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        return {
            "error": "Invalid AI JSON output",
            "raw": cleaned
        }

def main():
    load_dotenv()

    if len(sys.argv) < 2:
        sys.exit(1)

    repo = sys.argv[1]

    try:
        language, project_root = detect_project_info(repo)

        coverage_data = json.loads(COVERAGE_TOOLS[language](project_root))
        static_data = json.loads(STATIC_TOOLS[language](project_root))

        payload = build_agent_payload(static_data, coverage_data)

        agent = Agent(
            system_prompt=SYSTEM_PROMPT,
            model=os.getenv("AGENT_MODEL_ID")
        )

        response = agent(json.dumps(payload))
        ai_output = safe_parse_ai_output(response)

        print(json.dumps({
            "metadata": {
                "repository": repo,
                "project_root": project_root,
                "language": language,
                "status": "success"
            },
            "static_analysis": static_data,
            "coverage": coverage_data,
            "ai_interpretation": ai_output
        }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))

if __name__ == "__main__":
    main()