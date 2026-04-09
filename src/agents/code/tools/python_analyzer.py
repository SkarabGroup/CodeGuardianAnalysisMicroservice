import subprocess
import json
import os
from typing import Dict, Any

def run_python_analysis(directory: str) -> Dict[str, Any]:
    """
    Execute static analysis and code coverage of a Python repository,
    returning a compact optimized payload to the AI Agent.
    """
    results = {
        "static_analysis": {"total_issues": 0, "issues": []},
        "coverage": {"status": "failed", "totals": {}, "files_with_missing_branches": []}
    }

    ruff_report_path = os.path.join(directory, "report_Python.json")
    subprocess.run(
        ['ruff', 'check', '--select', 'ALL', '--output-format', 'json', '-o', ruff_report_path, directory],
        capture_output=True,
        text=True
    )

    if os.path.exists(ruff_report_path):
        with open(ruff_report_path, 'r') as f:
            try:
                ruff_data = json.load(f)
                results["static_analysis"]["total_issues"] = len(ruff_data)
                for issue in ruff_data:
                    results["static_analysis"]["issues"].append({
                        "file": issue.get("filename"),
                        "line": issue.get("location", {}).get("row"),
                        "code": issue.get("code"),
                        "message": issue.get("message")
                    })
            except json.JSONDecodeError:
                results["static_analysis"] = {"error": "JSON di Ruff non valido"}

    subprocess.run(f"cd {directory} && pip install -r requirements.txt || true", shell=True, capture_output=True)

    subprocess.run(f"cd {directory} && coverage run --branch -m pytest --json-report --json-report-file=report_tests.json || true", shell=True, capture_output=True) [cite: 14]
    subprocess.run(f"cd {directory} && coverage json -o report_Coverage_Python.json", shell=True, capture_output=True)

    cov_report_path = os.path.join(directory, "report_Coverage_Python.json")
    if os.path.exists(cov_report_path):
        with open(cov_report_path, 'r') as f:
            try:
                cov_data = json.load(f)
                results["coverage"]["status"] = "success"
                
                totals = cov_data.get("totals", {})
                results["coverage"]["totals"] = {
                    "percent_covered": totals.get("percent_covered"),
                    "missing_lines_count": totals.get("missing_lines"),
                    "missing_branches": totals.get("missing_branches")
                }
        
                files = cov_data.get("files", {})
                for file_path, data in files.items():
                    if data.get("summary", {}).get("missing_branches", 0) > 0:
                        results["coverage"]["files_with_missing_branches"].append({
                            "file": file_path,
                            "missing_lines": data.get("missing_lines", []),
                            "percent_branches_covered": data.get("summary", {}).get("percent_branches_covered")
                        })
            except json.JSONDecodeError:
                 results["coverage"]["status"] = "JSON parse error"

    return results