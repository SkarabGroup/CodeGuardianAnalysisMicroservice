import subprocess
import json
import os
import re
from strands import tool
from tools.models import StaticIssue, IssueLocation, StaticAnalysisReport

MAX_ISSUES    = 100
TOOL_NAME     = "PMD"
LANGUAGE      = "java"
PMD_DOCS_BASE = "https://docs.pmd-code.org/latest/pmd_rules"

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2, "info": 3}

PMD_RULESETS = [
    "category/java/design.xml",
    "category/java/errorprone.xml",
    "category/java/security.xml",
    "category/java/codestyle.xml",
]

RULESET_MAP = {
    "Security":       ("security",    "high"),
    "Error Prone":    ("bug",         "high"),
    "Design":         ("complexity",  "medium"),
    "Code Style":     ("style",       "low"),
    "Best Practices": ("refactoring", "medium"),
    "Performance":    ("bug",         "medium"),
}

PRIORITY_MAP = {1: "high", 2: "high", 3: "medium", 4: "low", 5: "info"}

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
            line_start = int(violation.get("beginline", 0)),
            line_end   = int(violation.get("endline", violation.get("beginline", 0))),
            column     = int(violation.get("begincolumn", 0)),
        )

    @staticmethod
    def get_rule_url(ruleset: str, rule: str) -> str:
        parts = str(ruleset).replace("category/", "").replace(".xml", "").replace("/", "_")
        slug  = re.sub(r'(?<!^)(?=[A-Z])', '_', str(rule)).lower()
        return f"{PMD_DOCS_BASE}/{parts}/#{slug}"

    @classmethod
    def map(cls, violation: dict, file_path: str, repo_path: str) -> StaticIssue | None:
        if not isinstance(violation, dict): return None
        ruleset  = str(violation.get("ruleset", ""))
        rule     = str(violation.get("rule", ""))
        priority = int(violation.get("priority", 5))
        category, severity = cls.get_category_and_severity(ruleset, priority)
        return StaticIssue(
            file          = os.path.relpath(file_path, repo_path),
            location      = cls.get_location(violation),
            rule          = rule,
            category      = category,
            severity      = severity,
            description   = str(violation.get("description", "")),
            suggested_fix = "No automatic fix available — requires manual review",
            url           = cls.get_rule_url(ruleset, rule),
        )

class PMDRunner:
    def _find_pmd_executable(self) -> str:
        for candidate in ["/opt/pmd-bin-7.0.0/bin/pmd", "/opt/pmd/bin/pmd", "pmd"]:
            if os.path.isfile(candidate) or candidate == "pmd":
                return candidate
        raise FileNotFoundError("PMD executable not found")

    def run(self, repo_path: str) -> dict:
        pmd = self._find_pmd_executable()
        cmd = [pmd, "check", "-d", repo_path, "-R", ",".join(PMD_RULESETS), "-f", "json"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        raw = result.stdout.strip()
        if not raw: return {}
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

@tool
def java_static_analysis(repo_path: str) -> str:
    try:
        raw_report = PMDRunner().run(repo_path)
        mapper     = PMDIssueMapper()
        filtered   = []

        files_list = raw_report.get("files", []) if isinstance(raw_report.get("files"), list) else []
        for file_entry in files_list:
            if not isinstance(file_entry, dict): continue
            file_path  = file_entry.get("filename", "")
            violations = file_entry.get("violations", [])
            if isinstance(violations, list):
                for v in violations:
                    mapped = mapper.map(v, file_path, repo_path)
                    if mapped:
                        filtered.append(mapped.to_dict())

        filtered_sorted = sorted(filtered, key=lambda i: SEVERITY_ORDER.get(i.get("severity", "info"), 99))

        report = StaticAnalysisReport(
            language = LANGUAGE,
            tool     = TOOL_NAME,
            issues   = filtered_sorted[:MAX_ISSUES],
            total    = len(filtered),
        )
        return json.dumps(report.to_dict())
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})