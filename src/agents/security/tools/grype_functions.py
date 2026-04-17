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

def run_syft_scan(repo_path: str, sbom_file: str) -> list | None:
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
                "type": "SyftError",
                "message": "Syft did not produce a valid SBOM file",
                "details": None
            }

        return None

    except subprocess.TimeoutExpired:
        return {
            "type": "SyftError",
            "message": "Timeout during Syft execution",
            "details": None
        }

    except subprocess.CalledProcessError as e:
        stderr_text = (e.stderr or b"").decode(errors="replace")

        message = "Syft execution failed"
        if "no such file or directory" in stderr_text.lower():
            message = "Syft could not access the repository path"
        elif "failed to catalog" in stderr_text.lower():
            message = "Syft failed to catalogue the repository contents"

        return [{
            "type": "SyftError",
            "message": message,
            "details": stderr_text
        }]


def run_grype_scan(sbom_file: str, output_file: str) -> list | None:
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
            return [{
                "type": "GrypeError",
                "message": "Grype did not produce a valid report file",
                "details": None
            }]

        return None

    except subprocess.TimeoutExpired:
        return [{
            "type": "GrypeError",
            "message": "Timeout during Grype execution",
            "details": None
        }]

    except subprocess.CalledProcessError as e:
        stderr_text = (e.stderr or b"").decode(errors="replace")
        
        message = "Grype execution failed"
        if any(x in stderr_text.lower() for x in ["db is too old", "vulnerability database"]):
            message = "Grype vulnerability database is outdated or unavailable"
        elif any(x in stderr_text.lower() for x in ["failed to load", "no such file"]):
            message = "Grype could not load the SBOM file"
        elif any(x in stderr_text.lower() for x in ["unsupported sbom", "unknown format"]):
            message = "Grype does not recognise the SBOM format produced by Syft"

        return [{
            "type": "GrypeError",
            "message": message,
            "details": stderr_text
        }]


# -------------------------
# PARSER FUNCTION
# -------------------------

def parse_grype_report(output_file: str) -> dict:
    if not os.path.exists(output_file):
        return {"error_obj": {"type": "GrypeParseError", "message": "Grype report file was not found", "details": None}}

    try:
        with open(output_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
            full_data = json.loads(content) if content else {"matches": []}
    except json.JSONDecodeError:
        return {"error_obj": {"type": "GrypeParseError", "message": "Grype report contains invalid JSON", "details": None}}

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

    syft_errors = run_syft_scan(repo_path, sbom_file)
    if syft_errors:
        return {
            "status": "error",
            "findings_to_analyze": [],
            "errors": syft_errors,
        }

    grype_errors = run_grype_scan(sbom_file, output_file)
    if grype_errors:
        return {
            "status": "error",
            "findings_to_analyze": [],
            "errors": grype_errors
        }

    result = parse_grype_report(output_file)

    if "error_obj" in result:
        return {
            "status": "error",
            "findings_to_analyze": [],
            "errors": [result["error_obj"]]
        }

    return {
        "status": "success",
        "findings_to_analyze": result.get("findings_to_analyze", []),
        "errors": [],
    }
