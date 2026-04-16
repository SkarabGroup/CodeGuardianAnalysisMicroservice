import json
import os

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

# ------------------------
# PARSER
# ------------------------
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
        return {"raw_findings": []}
    
    all_findings = []

    for match in matches:
        vuln = match.get("vulnerability") or {}
        artifact = match.get("artifact") or {}

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

        all_findings.append(finding)
    all_findings = dedupe(all_findings)

    return {"raw_findings": all_findings}

