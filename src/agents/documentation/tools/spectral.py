import json
import subprocess
from pathlib import Path
from typing import Optional

from strands import tool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _run(cmd: list[str]) -> tuple[int, str, str]:
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def _spectral_binary() -> str:
    rc, _, _ = _run(["spectral", "--version"])
    return "spectral" if rc == 0 else "npx"


def _find_candidates(root: Path, extensions: list[str]) -> list[Path]:
    found = []
    for ext in extensions:
        found.extend(root.rglob(f"*{ext}"))
    return [
        p for p in found
        if ".git" not in p.parts and "node_modules" not in p.parts and ".spectral" not in p.parts
    ]


def _severity_label(code: int) -> str:
    return {0: "CRITICAL", 1: "HIGH", 2: "MEDIUM", 3: "LOW"}.get(code, "unknown")


def _lint_file(spectral_bin: str, file_path: Path) -> dict:
    cmd = [spectral_bin]
    if spectral_bin == "npx":
        cmd.append("@stoplight/spectral-cli")

    cmd += ["lint", str(file_path), "--format", "json", "--ruleset", "tools/.spectral.yaml"]

    rc, stdout, stderr = _run(cmd)

    issues = []
    try:
        for item in json.loads(stdout) if stdout.strip() else []:
            issues.append({
                "code":     item.get("code", ""),
                "message":  item.get("message", ""),
                "severity": _severity_label(item.get("severity", 1)),
                "path":     item.get("path", []),
            })
    except json.JSONDecodeError:
        pass

    return {
        "file":        str(file_path),
        "lint_ok":     rc == 0,
        "issue_count": len(issues),
        "issues":      issues,
        "stderr":      stderr.strip() or None,
    }


def _summarize(results: list[dict]) -> dict:
    totals = {"error": 0, "warning": 0, "info": 0, "hint": 0}
    files_with_errors = 0
    for r in results:
        for issue in r["issues"]:
            totals[issue["severity"]] = totals.get(issue["severity"], 0) + 1
        if any(i["severity"] == "error" for i in r["issues"]):
            files_with_errors += 1
    return {
        "files_analyzed":    len(results),
        "files_with_errors": files_with_errors,
        "totals":            totals,
    }


# ---------------------------------------------------------------------------
# Strands tool
# ---------------------------------------------------------------------------

@tool
def spectral_analyze_repo(
    repo_path: str,
) -> dict:
    """
    Parse OpenAPI/AsyncAPI/JSON files from a local repository with Spectral.

    Args:
        repo_path: Absolute or relative path to the repository folder.

    Returns:
        A dictionary with:
          - summary: aggregate statistics (analyzed files, errors, warnings…)
          - results: detailed list for each file (file path, lint status, issue count, list of issues(code, message, severity, path))
          - error: message in case of blocking error (optional)
    """
    extensions = [".yaml", ".yml", ".json"]

    root = Path(repo_path).expanduser().resolve()

    if not root.exists() or not root.is_dir():
        return {
            "summary": {},
            "results": [],
            "error": f"Folder not found: {root}",
        }

    spectral_bin = _spectral_binary()

    candidates = _find_candidates(root, extensions)[:50]  # Limitiamo a 50 file per evitare sovraccarichi

    if not candidates:
        return {
            "summary": {"files_analyzed": 0},
            "results": [],
            "error": None,
            "message": "it hasen't been found any files to analyze.",
        }

    results = []
    for file_path in candidates:
        lint_result = _lint_file(spectral_bin, file_path)
        lint_result["file"] = str(file_path.relative_to(root))
        results.append(lint_result)

    return {
        "summary": _summarize(results),
        "results": results,
        "error":   None,
    }

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Do analyze of OpenAPI/AsyncAPI/JSON files in a repository with Spectral")
    parser.add_argument("repo_path", help="Path to the repository folder")
    args = parser.parse_args()

    analysis_result = spectral_analyze_repo(args.repo_path)
    print(json.dumps(analysis_result, indent=2))