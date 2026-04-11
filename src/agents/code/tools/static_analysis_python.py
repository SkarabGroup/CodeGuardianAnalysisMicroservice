import subprocess
import json
import os
from strands import tool

from tools.models import StaticIssue, IssueLocation, StaticAnalysisReport


# ─── Constants ────────────────────────────────────────────────────────────────

REPORT_PATH   = "/tmp/static_analysis_python.json"
MAX_ISSUES    = 10
TOOL_NAME     = "Ruff"
LANGUAGE      = "python"
RUFF_DOCS_BASE = "https://docs.astral.sh/ruff/rules"

FILTER_PREFIXES = ("S", "B", "C90", "PLR")

SEVERITY_MAP = {
    "S":   ("security",   "high"),
    "B":   ("bug",        "high"),
    "C90": ("complexity", "medium"),
    "PLR": ("refactoring","medium"),
}

APPLICABILITY_LABELS = {
    "safe":    "Auto-applicable",
    "unsafe":  "Unsafe — review before applying",
    "display": "Suggestion only",
}


# ─── Mapper ───────────────────────────────────────────────────────────────────

class RuffIssueMapper:

    @staticmethod
    def get_category_and_severity(code: str) -> tuple[str, str]:
        for prefix, (category, severity) in SEVERITY_MAP.items():
            if code.startswith(prefix):
                return category, severity
        return "style", "info"

    @staticmethod
    def get_suggested_fix(issue: dict) -> str:
        fix = issue.get("fix")
        if not fix:
            return "No automatic fix available — requires manual review"
        message      = fix.get("message", "")
        applicability = fix.get("applicability", "")
        label        = APPLICABILITY_LABELS.get(applicability, applicability)
        return f"{message} [{label}]" if message else "Requires architectural review"

    @staticmethod
    def get_location(issue: dict) -> IssueLocation:
        loc     = issue.get("location") or {}
        end_loc = issue.get("end_location") or {}
        return IssueLocation(
            line_start = loc.get("row", 0),
            line_end   = end_loc.get("row", loc.get("row", 0)),
            column     = loc.get("column", 0),
        )

    @classmethod
    def map(cls, issue: dict, repo_path: str) -> StaticIssue | None:
        if not issue or not isinstance(issue, dict):
            return None
        code = issue.get("code", "")
        if not code.startswith(FILTER_PREFIXES):
            return None
        category, severity = cls.get_category_and_severity(code)
        return StaticIssue(
            file          = os.path.relpath(issue.get("filename", ""), repo_path),
            location      = cls.get_location(issue),
            rule          = code,
            category      = category,
            severity      = severity,
            description   = issue.get("message", ""),
            suggested_fix = cls.get_suggested_fix(issue),
            url           = f"{RUFF_DOCS_BASE}/{code.lower()}",
        )


# ─── Runner ───────────────────────────────────────────────────────────────────

class RuffRunner:

    def __init__(self, report_path: str = REPORT_PATH):
        self.report_path = report_path

    def run(self, repo_path: str) -> list[dict]:
        cmd = [
            "ruff", "check",
            "--select", "ALL",
            "--output-format", "json",
            "--output-file", self.report_path,
            repo_path,
        ]
        subprocess.run(cmd, capture_output=True, text=True, check=False)
        with open(self.report_path, "r") as f:
            return json.load(f)


# ─── Tool ─────────────────────────────────────────────────────────────────────

@tool
def python_static_analysis(repo_path: str) -> str:
    """
    Execute static analysis on a Python repository using Ruff.
    Filters: Security (S), Bugbear (B), Complexity (C90), Refactoring (PLR).
    Returns a normalized JSON report compatible with all language tools.
    """
    try:
        all_issues = RuffRunner().run(repo_path)
        mapper     = RuffIssueMapper()

        filtered = [
            mapped.to_dict()
            for issue in all_issues
            if (mapped := mapper.map(issue, repo_path)) is not None
        ]

        report = StaticAnalysisReport(
            language = LANGUAGE,
            tool     = TOOL_NAME,
            issues   = filtered[:MAX_ISSUES],
            total    = len(filtered),
        )
        return json.dumps(report.to_dict())

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})
