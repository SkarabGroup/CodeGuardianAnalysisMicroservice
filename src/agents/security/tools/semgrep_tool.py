import subprocess
import json
from strands import tool

@tool
def run_semgrep(repo_path: str) -> dict:
    """
    Run Semgrep scan on a repository and return summarized findings.
    Use this tool to receive findings about OWASP Top Ten vulnerabilities in the codebase.
    """

    try:
        result = subprocess.run(
            [
                "semgrep",
                "scan",
                "--config", "p/owasp-top-ten",
                "--json",
                "--max-target-bytes", "50000000",
                repo_path
            ],
            capture_output=True,
            text=True,
            timeout=350
        )

        if result.returncode != 0:
            return {
                "error": "Semgrep failed",
                "stderr": result.stderr,
                "returncode": result.returncode
            }

        try:
            output = json.loads(result.stdout)
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON output from semgrep",
                "raw_output": result.stdout[:1000]
            }

        findings = []
        severity_count = {}
        type_count = {}

        for r in output.get("results", []):
            vuln_type = (
                r.get("extra", {})
                 .get("metadata", {})
                 .get("vulnerability_class", ["Unknown"])[0]
            )

            severity = r.get("severity", "UNKNOWN")

            findings.append({
                "type": vuln_type,
                "severity": severity,
                "file": r.get("path"),
                "line": r.get("start", {}).get("line"),
                "message": r.get("extra", {}).get("message"),
            })

            # stats
            severity_count[severity] = severity_count.get(severity, 0) + 1
            type_count[vuln_type] = type_count.get(vuln_type, 0) + 1

        errors = [
            {
                "type": e.get("type"),
                "message": e.get("message"),
                "file": e.get("path")
            }
            for e in output.get("errors", [])
        ]

        return {
            "summary": {
                "total": len(findings),
                "by_severity": severity_count,
                "by_type": type_count,
            },
            "findings": findings,
            "errors": errors
        }

    except subprocess.TimeoutExpired:
        return {"error": "Timeout during analysis"}

    except Exception as e:
        return {"error": str(e)}