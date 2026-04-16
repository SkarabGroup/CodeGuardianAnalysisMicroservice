import subprocess
import json
import os
from strands import tool


# -------------------------
# DEDUPLICATION HELPER
# -------------------------
def dedupe(findings):
    seen = set()
    result = []

    for f in findings:
        key = (
            f["path"],
            f["package_name"],
            f["package_version"],
            f["vulnerability_id"],
            f["severity"],
        )

        if key not in seen:
            seen.add(key)
            result.append(f)

    return result

# -------------------------
# RUNNER FUNCTIONS
# -------------------------

def run_syft_scan(repo_path: str, sbom_file: str) -> dict | None:
    try:
        if os.path.exists(sbom_file):
            os.remove(sbom_file)

        subprocess.run(
            [
                "syft",
                f"dir:{repo_path}",
                "-o", f"json={sbom_file}",
            ],
            check=True,
            stderr=subprocess.PIPE,
            timeout=180
        )

        if not os.path.exists(sbom_file) or os.path.getsize(sbom_file) == 0:
            return {
                "error": "Syft did not produce a valid SBOM file",
                "repo_path": repo_path
            }

        return None

    except subprocess.TimeoutExpired:
        return {
            "error": "Timeout during Syft execution",
            "repo_path": repo_path
        }

    except subprocess.CalledProcessError as e:
        stderr_text = (e.stderr or b"").decode(errors="replace")

        if "no such file or directory" in stderr_text.lower():
            return {
                "error": "Syft could not access the repository path",
                "details": stderr_text,
                "repo_path": repo_path
            }
        if "failed to catalog" in stderr_text.lower():
            return {
                "error": "Syft failed to catalogue the repository contents",
                "details": stderr_text,
                "repo_path": repo_path
            }

        return {
            "error": "Syft execution failed",
            "details": stderr_text,
            "repo_path": repo_path
        }


def run_grype_scan(sbom_file: str, output_file: str) -> dict | None:
    try:
        if os.path.exists(output_file):
            os.remove(output_file)

        subprocess.run(
            [
                "grype",
                f"sbom:{sbom_file}",
                "-o", f"json={output_file}",
            ],
            check=True,
            stderr=subprocess.PIPE,
            timeout=250
        )

        if not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
            return {
                "error": "Grype did not produce a valid report file",
                "sbom_file": sbom_file
            }

        return None

    except subprocess.TimeoutExpired:
        return {
            "error": "Timeout during Grype execution",
            "sbom_file": sbom_file
        }

    except subprocess.CalledProcessError as e:
        stderr_text = (e.stderr or b"").decode(errors="replace")

        if "db is too old" in stderr_text.lower() or "vulnerability database" in stderr_text.lower():
            return {
                "error": (
                    "Grype vulnerability database is outdated or unavailable. "
                    "Run 'grype db update' and retry."
                ),
                "details": stderr_text
            }
        if "failed to load" in stderr_text.lower() or "no such file" in stderr_text.lower():
            return {
                "error": "Grype could not load the SBOM file",
                "details": stderr_text,
                "sbom_file": sbom_file
            }
        if "unsupported sbom" in stderr_text.lower() or "unknown format" in stderr_text.lower():
            return {
                "error": "Grype does not recognise the SBOM format produced by Syft",
                "details": stderr_text,
                "sbom_file": sbom_file
            }

        return {
            "error": "Grype execution failed",
            "details": stderr_text,
            "sbom_file": sbom_file
        }


# -------------------------
# PARSER FUNCTION
# -------------------------

def parse_grype_report(output_file: str) -> dict:
    if not os.path.exists(output_file):
        return {"error": "Grype report file was not found"}

    try:
        with open(output_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
            full_data = json.loads(content) if content else {"matches": []}
    except json.JSONDecodeError:
        return {"error": "Grype report contains invalid JSON"}

    matches = full_data.get("matches", [])

    if not matches:
        return {"findings_to_analyze": []}
    
    critical_findings = []
    high_findings = []
    medium_findings = []

    for match in matches:
        vuln = match.get("vulnerability") or {}
        artifact = match.get("artifact") or {}

        severity = (vuln.get("severity") or "").lower()

        if severity not in ["critical", "high", "medium"]:
            continue

        locations = artifact.get("locations") or []
        path = locations[0].get("path") if locations else "unknown"

        fix_info = vuln.get("fix") or {}
        fix_state = (fix_info.get("state") or "").lower()
        fix_versions = fix_info.get("versions") or []

        match_details = match.get("matchDetails") or []
        suggested_version = None
        if match_details:
            suggested_version = match_details[0].get("fix", {}).get("suggestedVersion")

        if fix_state == "fixed" and fix_versions:
            fix_hint = f"Update to version {', '.join(fix_versions)}"
        elif suggested_version:
            fix_hint = f"Update to version {suggested_version}"
        elif fix_state == "wont-fix":
            fix_hint = (
                "The maintainer has marked this as 'wont-fix'. "
                "Consider replacing the dependency."
            )
        elif fix_state == "not-fixed":
            fix_hint = "No fix has been released yet. Monitor the advisory for updates."
        else:
            fix_hint = "No fix information available."

        finding = {
            "path": path,
            "package_name": artifact.get("name", ""),
            "package_version": artifact.get("version", ""),
            "vulnerability_id": vuln.get("id", ""),
            "severity": vuln.get("severity", ""),
            "description": vuln.get("description", ""),
            "fix_hint": fix_hint,
            "remediation": None  
        }

        if severity == "critical":
            critical_findings.append(finding)
        elif severity == "high":
            high_findings.append(finding)
        elif severity== "medium":
            medium_findings.append(finding)
    
    critical_findings = dedupe(critical_findings)
    high_findings = dedupe(high_findings)
    medium_findings = dedupe(medium_findings)

    if len(critical_findings) >= 10:
        findings_for_agent = critical_findings[:10]

    elif len(critical_findings) > 0:
        needed = 10 - len(critical_findings)
        findings_for_agent = critical_findings + high_findings[:needed]

        if len(findings_for_agent) < 5:
            remaining = 5 - len(findings_for_agent)
            findings_for_agent += medium_findings[:remaining]

    elif len(high_findings) < 5:
        needed= 5 - len(high_findings)
        findings_for_agent = high_findings + medium_findings[:needed]
    
    else:
        findings_for_agent= high_findings[:10]

    return {"findings_to_analyze": findings_for_agent}


# -------------------------
# STRANDS AGENT TOOL
# -------------------------

@tool
def run_grype(repo_path: str) -> dict:
    """
    Run a Syft + Grype dependency vulnerability scan on a repository.

    This tool performs two sequential steps:
      1. Syft catalogs the repository and produces a JSON SBOM (Software Bill
         of Materials) listing all detected packages and their versions.
      2. Grype scans that SBOM against its vulnerability database and outputs
         a JSON report of known CVEs / GHSAs.

    When to use:
    - Use this tool to identify known CVEs and GHSAs in third-party dependencies.
    - Especially useful for detecting outdated or vulnerable libraries in any
      language ecosystem that Syft supports (npm, pip, Maven, Go, etc.).

    Args:
        repo_path (str): Absolute path to the repository to analyse.

    Returns:
        dict: A structured result containing:
            - "status": "success" or "error"
            - "findings_to_analyze": list of Critical findings, each with:
                "path": file-system path where the package was found,
                "packagename": name of the vulnerable package,
                "packageversion": currently installed version,
                "vulnerabilityid": CVE or GHSA identifier,
                "severity": severity tier (Critical),
                "description": short description of the vulnerability,
                "fix_hint": Grype-derived upgrade suggestion (use this to inform the remediation text you write),
                "remediation": None — to be filled by the agent.
            - "errors": list of errors (empty list on success, execution or parsing error on failure).
              Every error object always has exactly these three fields:
                "type": one of "SyftError", "GrypeError", "GrypeParseError", or an internal type,
                "message": human-readable description of the error,
                "details": additional context string, or null if not available
    """
    sbom_file   = "sbom.json"
    output_file = "raw_grype_report.json"

    syft_error = run_syft_scan(repo_path, sbom_file)
    if syft_error:
        return {
            "status": "error",
            "findings_to_analyze": [],
            "errors": [
                {
                    "type":    "SyftError",
                    "message": syft_error.get("error"),
                    "details": syft_error.get("details") 
                }
            ],
        }

    grype_error = run_grype_scan(sbom_file, output_file)
    if grype_error:
        return {
            "status": "error",
            "findings_to_analyze": [],
            "errors": [
                {
                    "type":    "GrypeError",
                    "message": grype_error.get("error"),
                    "details": grype_error.get("details") 
                }
            ],
        }

    result = parse_grype_report(output_file)

    if "error" in result:
        return {
            "status": "error",
            "findings_to_analyze": [],
            "errors": [
                {
                    "type":    "GrypeParseError",
                    "message": result.get("error"),
                    "details": None  
                }
            ],
        }

    return {
        "status": "success",
        "findings_to_analyze": result.get("findings_to_analyze", []),
        "errors": [],
    }
