import subprocess
import json
import os
from strands import tool

from tools.models import StaticIssue, IssueLocation, StaticAnalysisReport


# ─── Constants ────────────────────────────────────────────────────────────────

REPORT_PATH = "/tmp/static_analysis_java.json"
MAX_ISSUES  = 10
TOOL_NAME   = "PMD"
LANGUAGE    = "java"

PMD_DOCS_BASE = "https://docs.pmd-code.org/latest/pmd_rules"

PMD_RULESETS = [
    "category/java/design.xml",
    "category/java/errorprone.xml",
    "category/java/security.xml",
    "category/java/codestyle.xml",
]

# Maps PMD ruleset names → (normalized_category, severity)
RULESET_MAP = {
    "Security":   ("security",    "high"),
    "Error Prone":("bug",         "high"),
    "Design":     ("complexity",  "medium"),
    "Code Style": ("style",       "low"),
    "Best Practices": ("refactoring", "medium"),
    "Performance":("bug",         "medium"),
}

# Maps PMD priority (1–5) → severity label
PRIORITY_MAP = {
    1: "high",
    2: "high",
    3: "medium",
    4: "low",
    5: "info",
}


# ─── Mapper ───────────────────────────────────────────────────────────────────

class PMDIssueMapper:

    @staticmethod
    def get_category_and_severity(ruleset: str, priority: int) -> tuple[str, str]:
        for key, (category, _) in RULESET_MAP.items():
            if key.lower() in ruleset.lower():
                return category, PRIORITY_MAP.get(priority, "info")
        return "style", PRIORITY_MAP.get(priority, "info")

    @staticmethod
    def get_location(violation: dict) -> IssueLocation:
        return IssueLocation(
            line_start = violation.get("beginline", 0),
            line_end   = violation.get("endline", violation.get("beginline", 0)),
            column     = violation.get("begincolumn", 0),
        )

    @staticmethod
    def get_rule_url(ruleset: str, rule: str) -> str:
        # ruleset like "category/java/design.xml" → "java_design"
        parts = ruleset.replace("category/", "").replace(".xml", "").replace("/", "_")
        import re
        slug = re.sub(r'(?<!^)(?=[A-Z])', '_', rule).lower()
        return f"{PMD_DOCS_BASE}/{parts}/#{slug}"

    @classmethod
    def map(cls, violation: dict, file_path: str, repo_path: str) -> StaticIssue | None:
        if not violation or not isinstance(violation, dict):
            return None

        ruleset  = violation.get("ruleset", "")
        rule     = violation.get("rule", "")
        priority = int(violation.get("priority", 5))

        category, severity = cls.get_category_and_severity(ruleset, priority)

        return StaticIssue(
            file          = os.path.relpath(file_path, repo_path),
            location      = cls.get_location(violation),
            rule          = rule,
            category      = category,
            severity      = severity,
            description   = violation.get("description", ""),
            suggested_fix = "No automatic fix available — requires manual review",
            url           = cls.get_rule_url(ruleset, rule),
        )


# ─── Runner ───────────────────────────────────────────────────────────────────

class PMDRunner:

    def __init__(self, report_path: str = REPORT_PATH):
        self.report_path = report_path

    def _find_pmd_executable(self) -> str:
        for candidate in ["/opt/pmd/bin/pmd", "/usr/local/bin/pmd", "pmd"]:
            if os.path.isfile(candidate) or candidate == "pmd":
                return candidate
        raise FileNotFoundError("PMD executable not found")

    def run(self, repo_path: str) -> dict:
        pmd = self._find_pmd_executable()
        cmd = [
            pmd, "check",
            "-d", repo_path,
            "-R", ",".join(PMD_RULESETS),
            "-f", "json",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        raw = result.stdout.strip()
        if not raw:
            return {}
        return json.loads(raw)


# ─── Tool ─────────────────────────────────────────────────────────────────────

@tool
def java_static_analysis(repo_path: str) -> str:
    """
    Execute static analysis on a Java repository using PMD.
    Rulesets: Design, Error Prone, Security, Code Style.
    Returns a normalized JSON report compatible with all language tools.
    """
    try:
        raw_report = PMDRunner().run(repo_path)
        mapper     = PMDIssueMapper()
        filtered   = []

        for file_entry in raw_report.get("files", []):
            file_path  = file_entry.get("filename", "")
            violations = file_entry.get("violations", [])
            for v in violations:
                mapped = mapper.map(v, file_path, repo_path)
                if mapped:
                    filtered.append(mapped.to_dict())

        report = StaticAnalysisReport(
            language = LANGUAGE,
            tool     = TOOL_NAME,
            issues   = filtered[:MAX_ISSUES],
            total    = len(filtered),
        )
        return json.dumps(report.to_dict())

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})
