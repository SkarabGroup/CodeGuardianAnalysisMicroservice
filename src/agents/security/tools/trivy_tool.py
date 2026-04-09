import subprocess
import json
from strands import tool

@tool
def run_trivy(repo_path: str) -> dict:
    """
    Run Trivy secret scan on a repository and return summarized findings.
    """

    try: #trivy fs . --security-checks vuln,secret --format json > trivy_report.json
        result = subprocess.run(
    [
        "trivy",
        "fs",
        "--security-checks", "vuln,secret",
        "--format", "json",
        repo_path
    ],
    capture_output=True,
    text=True,
    timeout=350
)

        if result.returncode != 0:
            return {
                "error": "Trivy failed",
                "stderr": result.stderr,
                "returncode": result.returncode
            }

        try:
            output = json.loads(result.stdout)
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON output from Trivy",
                "raw_output": result.stdout[:1000]
            }

        findings = []
        severity_count = {}
        type_count = {}

        # Trivy structure: list of targets
        for target in output.get("Results", []):
            file_path = target.get("Target")

            for secret in target.get("Secrets", []):
                vuln_type = secret.get("Category", "Unknown")
                severity = secret.get("Severity", "UNKNOWN")

                findings.append({
                    "type": vuln_type,
                    "severity": severity,
                    "file": file_path,
                    "line": secret.get("StartLine"),
                    "message": secret.get("Title"),
                })

                # stats
                severity_count[severity] = severity_count.get(severity, 0) + 1
                type_count[vuln_type] = type_count.get(vuln_type, 0) + 1

        return {
            "summary": {
                "total": len(findings),
                "by_severity": severity_count,
                "by_type": type_count,
            },
            "findings": findings,
            "errors": []
        }

    except subprocess.TimeoutExpired:
        return {"error": "Timeout during analysis"}

    except Exception as e:
        return {"error": str(e)}