import json
import os
from helpers.path_normalizer import normalize_path
from helpers.deduplicators.deduplicator_grype import dedupe

def parse_grype_report(output_file: str, repo_path: str) -> dict:
    if not os.path.exists(output_file):
        return {
            "error": {
                "tool": "grype",
                "message": "Grype report file was not found"
            }
        }

    try:
        with open(output_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
            full_data = json.loads(content) if content else {"matches": []}
    except json.JSONDecodeError:
        return {
            "error": {
                "tool": "grype",
                "message": "Grype report contains invalid JSON"
            }
        }
    except Exception as e:
        return {
            "error": {
                "tool": "grype",
                "message": f"Unexpected error reading Grype report: {str(e)}"
            }
        }

    matches = full_data.get("matches", [])

    if not matches:
        return {"raw_findings": []}
    
    all_findings = []

    for match in matches:
        vuln = match.get("vulnerability") or {}
        artifact = match.get("artifact") or {}

        locations = artifact.get("locations") or []
        raw_path = locations[0].get("path") if locations else "unknown"
        clean_path = normalize_path(raw_path, repo_path)

        finding = {
            "path": clean_path,
            "package_name": artifact.get("name", ""),
            "package_version": artifact.get("version", ""),
            "vulnerability_id": vuln.get("id", ""),
            "severity": vuln.get("severity", ""),
            "description": vuln.get("description", ""),
            "remediation": None  
        }

        all_findings.append(finding)
    all_findings = dedupe(all_findings)

    return {"raw_findings": all_findings}