import subprocess
import json
from strands import tool


@tool
def run_grype(repo_path: str) -> dict:
    """
    Run Syft + Grype to detect vulnerabilities in project dependencies (SCA).

    This tool generates an SBOM using Syft and scans it with Grype.
    Returns normalized vulnerability findings including severity, package info,
    and available fixes.
    """

    try:
        # Step 1: Generate SBOM with Syft
        syft_result = subprocess.run(
            [
                "syft",
                "dir",
                repo_path,
                "-o",
                "json"
            ],
            capture_output=True,
            text=True,
            timeout=300
        )

        if syft_result.returncode != 0:
            return {
                "error": "Syft failed",
                "stderr": syft_result.stderr,
                "returncode": syft_result.returncode
            }

        # Step 2: Scan SBOM with Grype
        grype_result = subprocess.run(
            [
                "grype",
                "sbom:-",
                "-o",
                "json"
            ],
            input=syft_result.stdout,
            capture_output=True,
            text=True,
            timeout=300
        )

        if grype_result.returncode != 0:
            return {
                "error": "Grype failed",
                "stderr": grype_result.stderr,
                "returncode": grype_result.returncode
            }

        # Step 3: Parse output
        try:
            output = json.loads(grype_result.stdout)
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON output from Grype",
                "raw_output": grype_result.stdout[:1000]
            }

        findings = []
        severity_count = {}
        seen = set()

        for match in output.get("matches", []):
            vuln = match.get("vulnerability", {})
            artifact = match.get("artifact", {})
            match_details = match.get("matchDetails", [])

            vuln_id = vuln.get("id")
            package = artifact.get("name")
            version = artifact.get("version")

            # dedup key
            key = (vuln_id, package, version)
            if key in seen:
                continue
            seen.add(key)

            severity = (vuln.get("severity") or "UNKNOWN").upper()

            # fix version
            fix_versions = vuln.get("fix", {}).get("versions", [])
            fixed_version = fix_versions[0] if fix_versions else None

            if not fixed_version and match_details:
                fixed_version = (
                    match_details[0]
                    .get("fix", {})
                    .get("suggestedVersion")
                )

            finding = {
                "id": vuln_id,
                "type": "dependency_vulnerability",
                "severity": severity,
                "package": package,
                "version": version,
                "fixed_version": fixed_version,
                "fix_available": vuln.get("fix", {}).get("state") == "fixed",
                "description": vuln.get("description"),
            }

            findings.append(finding)

            # stats
            severity_count[severity] = severity_count.get(severity, 0) + 1

        return {
            "summary": {
                "total": len(findings),
                "by_severity": severity_count,
            },
            "findings": findings,
            "errors": []
        }

    except subprocess.TimeoutExpired:
        return {"error": "Timeout during analysis"}

    except Exception as e:
        return {"error": str(e)}