import subprocess
import json
import os
from dataclasses import dataclass, asdict
from typing import Optional
from strands import tool


# ─── Constants ────────────────────────────────────────────────────────────────

REPORT_PATH = "/tmp/static_analysis.json"
MAX_ISSUES = 30

FILTER_PREFIXES = ("S", "B", "C90", "PLR")

SEVERITY_MAP = {
    "S":   "security",
    "B":   "bug",
    "C90": "complexity",
    "PLR": "refactoring",
}

APPLICABILITY_LABELS = {
    "safe":    "Auto-applicable",
    "unsafe":  "Unsafe — review before applying",
    "display": "Suggestion only",
}

RUFF_DOCS_BASE = "https://docs.astral.sh/ruff/rules"


# ─── Data Models ──────────────────────────────────────────────────────────────

@dataclass
class IssueLocation:
    line_start: int
    line_end: int
    column: int


@dataclass
class StaticIssue:
    file: str
    location: IssueLocation
    rule: str
    category: str
    description: str
    suggested_fix: str
    url: str

    def to_dict(self) -> dict:
        result = asdict(self)
        result["location"] = asdict(self.location)
        return result


# ─── Mappers ──────────────────────────────────────────────────────────────────

class RuffIssueMapper:

    @staticmethod
    def get_category(code: str) -> str:
        for prefix, category in SEVERITY_MAP.items():
            if code.startswith(prefix):
                return category
        return "unknown"

    @staticmethod
    def get_suggested_fix(issue: dict) -> str:
        fix = issue.get("fix")
        if not fix:
            return "No automatic fix available — requires manual review"

        message = fix.get("message", "")
        applicability = fix.get("applicability", "")
        label = APPLICABILITY_LABELS.get(applicability, applicability)

        return f"{message} [{label}]" if message else "Requires architectural review"

    @staticmethod
    def get_location(issue: dict) -> IssueLocation:
        location     = issue.get("location") or {}
        end_location = issue.get("end_location") or {}
        return IssueLocation(
            line_start = location.get("row", 0),
            line_end   = end_location.get("row", location.get("row", 0)),
            column     = location.get("column", 0),
        )

    @classmethod
    def map(cls, issue: dict, repo_path: str) -> Optional[StaticIssue]:
        if not issue or not isinstance(issue, dict):
            return None

        code = issue.get("code", "")
        if not code.startswith(FILTER_PREFIXES):
            return None

        filename = issue.get("filename", "")

        return StaticIssue(
            file        = os.path.relpath(filename, repo_path),
            location    = cls.get_location(issue),
            rule        = code,
            category    = cls.get_category(code),
            description = issue.get("message", ""),
            suggested_fix = cls.get_suggested_fix(issue),
            url         = f"{RUFF_DOCS_BASE}/{code.lower()}",
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
    Execute static analysis on a Python repository using the tool 'Ruff'.
    Identifies syntax errors, bugs, security vulnerabilities and complex issues.
    Filters by: Security (S), Bugbear (B), Complexity (C90), Refactoring (PLR).
    Returns a JSON array with the top issues found.
    """
    try:
        runner = RuffRunner()
        all_issues = runner.run(repo_path)

        mapper = RuffIssueMapper()
        filtered = [
            mapped.to_dict()
            for issue in all_issues
            if (mapped := mapper.map(issue, repo_path)) is not None
        ]

        return json.dumps(filtered[:MAX_ISSUES])

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})