import sys
import json
import os
import re
import concurrent.futures
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

MAX_ISSUES_TO_MODEL   = 300
MAX_COVERAGE_TO_MODEL = 100

def build_agent_payload(static: dict, coverage: dict) -> dict:
    payload = {}

    if static.get("status") == "error":
        payload["static_analysis_error"] = static.get("message")
    elif "issues" in static:
        payload["static_analysis"] = {
            "language": static.get("language"),
            "tool":     static.get("tool"),
            "total":    static.get("total"),
            "issues":   static.get("issues", [])[:MAX_ISSUES_TO_MODEL],
        }

    if coverage.get("status") == "error":
        payload["coverage_error"] = coverage.get("message")
    elif "files" in coverage:
        files = coverage.get("files", [])
        sorted_files = sorted(
            files,
            key=lambda f: (-f.get("missing_branches", 0), f.get("line_coverage_pct", 100))
        )
        payload["coverage"] = {
            "language":             coverage.get("language"),
            "tool":                 coverage.get("tool"),
            "overall_line_pct":     coverage.get("overall_line_pct"),
            "overall_branch_pct":   coverage.get("overall_branch_pct"),
            "overall_function_pct": coverage.get("overall_function_pct"),
            "test_summary":         coverage.get("test_summary"),
            "files":                sorted_files[:MAX_COVERAGE_TO_MODEL],
            "uncovered_files":      coverage.get("uncovered_files", []),
        }

    return payload

SYSTEM_PROMPT = """
You are an elite Principal Software Engineer and Security Researcher performing a brutal, no-nonsense code review.

INPUT FORMAT:
You will receive a JSON payload containing `static_analysis` (from tools like Biome/Ruff/PMD) and `coverage` (from Istanbul/Coverage.py/JaCoCo).

OUTPUT FORMAT:
Return ONLY a raw, valid JSON object matching this exact schema. DO NOT wrap it in markdown blockquotes (no ```json).
{
    "verdict": "Critical|Poor|Fair|Good|Excellent",
    "executive_summary": "A brutally honest, highly technical summary of the codebase health. No fluff. Cite concrete metrics.",
    "static_analysis_evaluation": {
        "total_issues_analyzed": int,
        "key_issues_reasoning": [
        {
            "file": "string",
            "location": {
            "line_start": int,
            "line_end": int,
            "column": int
            },
            "rule": "string",
            "severity": "string",
            "original_description": "string",
            "ai_reasoning": "Deeply technical explanation of the underlying vulnerability, memory leak, or architectural bottleneck.",
            "suggested_resolution": "Exact refactoring strategy, design pattern, or code-level fix."
        }
        ]
    },
    "coverage_evaluation": {
        "overall_health": "string",
        "critical_files_reasoning": [
        {
            "file": "string",
            "line_coverage_pct": float,
            "missing_lines": [int],
            "missing_branches": int,
            "ai_reasoning": "Analysis of the specific missing test execution paths (e.g., unhandled Promise rejections, missing auth branches) and their production impact."
        }
        ]
    }
}

STRICT ENGINEERING RULES - PENALTY FOR NON-COMPLIANCE:
1. NO DUPLICATE RULES: You MUST extract EXACTLY 10 distinct issues in `key_issues_reasoning` (or all if less than 10). YOU ARE STRICTLY FORBIDDEN from repeating the same `rule` (e.g., do not output `noUnusedFunctionParameters` more than once). Group similar issues mentally, pick the worst offender, and use the remaining slots for DIFFERENT rules.
2. MAXIMIZE SEVERITY: Ignore stylistic warnings unless absolutely necessary. Hunt for bugs, security flaws, and high-complexity issues.
3. BE SPECIFIC: In `suggested_resolution`, do not write "fix the issue". Tell the developer exactly what to do (e.g., "Implement early returns", "Use an optional chain `?.` to prevent TypeError").
4. FILE DIVERSITY: Extract EXACTLY 15 distinct files for `critical_files_reasoning` (or all if less than 15). Focus on files with high complexity, 0% coverage, or missing branches in core logic.
5. MATH ACCURACY: `total_issues_analyzed` MUST exactly match the `total` field provided in the static analysis input.
6. NO HALLUCINATIONS: Use ONLY the provided JSON data. Never invent files, rules, locations, or metrics.
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

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_cov = executor.submit(COVERAGE_TOOLS[language], project_root)
            future_static = executor.submit(STATIC_TOOLS[language], project_root)

            coverage_data = json.loads(future_cov.result())
            static_data = json.loads(future_static.result())

        payload = build_agent_payload(static_data, coverage_data)

        agent = Agent(
            system_prompt=SYSTEM_PROMPT,
            model=os.getenv("CODE_AGENT_MODEL_ID")
        )

        response = agent(json.dumps(payload))
        ai_output = safe_parse_ai_output(response)

        print(json.dumps({
            "analysis_report": {
                "metadata": {
                "language": language,
                "status": "success"
                },
                "ai_interpretation": ai_output
            }
        }))

    except Exception as e:
        print(json.dumps({
            "analysis_report": {
                "metadata": {
                    "language": "unknown",
                    "status": "error"
                },
                "ai_interpretation": {
                    "verdict": "CRITICAL",
                    "executive_summary": f"Execution Error: {str(e)}",
                    "static_analysis_evaluation": { "total_issues_analyzed": 0, "key_issues_reasoning": [] },
                    "coverage_evaluation": { "overall_health": "Error", "critical_files_reasoning": [] }
                }
            }
        }))

if __name__ == "__main__":
    main()