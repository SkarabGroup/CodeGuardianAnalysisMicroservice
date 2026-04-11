import subprocess
import json
import os
from strands import tool

from tools.models import StaticIssue, IssueLocation, StaticAnalysisReport


# ─── Constants ────────────────────────────────────────────────────────────────

REPORT_PATH = "/tmp/static_analysis_js.json"
MAX_ISSUES  = 10
TOOL_NAME   = "Biome"
LANGUAGE    = "javascript/typescript"

BIOME_DOCS_BASE = "https://biomejs.dev/linter/rules"

# Maps Biome category prefixes → (normalized_category, severity)
CATEGORY_MAP = {
    "lint/security":     ("security",    "high"),
    "lint/correctness":  ("bug",         "high"),
    "lint/complexity":   ("complexity",  "medium"),
    "lint/suspicious":   ("bug",         "high"),
    "lint/performance":  ("bug",         "medium"),
    "lint/style":        ("style",       "low"),
    "lint/nursery":      ("refactoring", "low"),
}

BIOME_SEVERITY_MAP = {
    "error":   "high",
    "warning": "medium",
    "info":    "low",
}


# ─── Mapper ───────────────────────────────────────────────────────────────────

class BiomeIssueMapper:

    @staticmethod
    def get_category_and_severity(biome_category: str, biome_severity: str) -> tuple[str, str]:
        for prefix, (category, sev) in CATEGORY_MAP.items():
            if biome_category.startswith(prefix):
                return category, sev
        # fall back to severity field
        return "style", BIOME_SEVERITY_MAP.get(biome_severity, "info")

    @staticmethod
    def get_location(diagnostic: dict) -> IssueLocation:
        location = diagnostic.get("location") or {}
        span     = location.get("span") or {}
        start    = span.get("start") or {}
        end      = span.get("end") or {}
        return IssueLocation(
            line_start = start.get("line", 0),
            line_end   = end.get("line", start.get("line", 0)),
            column     = start.get("character", 0),
        )

    @staticmethod
    def get_suggested_fix(diagnostic: dict) -> str:
        advices = diagnostic.get("advices", {}).get("advices", [])
        fixes   = [
            a.get("diff", {}).get("dict", "") or a.get("log", [{}])[0].get("content", "")
            for a in advices
            if a.get("tag") in ("fix", "log")
        ]
        fixes = [f for f in fixes if f]
        return fixes[0] if fixes else "No automatic fix available — requires manual review"

    @staticmethod
    def get_rule_url(category: str) -> str:
        # category like "lint/correctness/noUnreachable" → rule slug = "no-unreachable"
        parts = category.split("/")
        if len(parts) >= 3:
            import re
            slug = re.sub(r'(?<!^)(?=[A-Z])', '-', parts[-1]).lower()
            return f"{BIOME_DOCS_BASE}/{slug}"
        return BIOME_DOCS_BASE

    @classmethod
    def map(cls, diagnostic: dict, repo_path: str) -> StaticIssue | None:
        if not diagnostic or not isinstance(diagnostic, dict):
            return None

        biome_category = diagnostic.get("category", "")
        biome_severity = diagnostic.get("severity", "info")

        # Only keep issues in relevant categories
        relevant = any(biome_category.startswith(p) for p in CATEGORY_MAP)
        if not relevant:
            return None

        category, severity = cls.get_category_and_severity(biome_category, biome_severity)

        file_path = diagnostic.get("location", {}).get("path", {}).get("file", "")
        description = diagnostic.get("message", "")
        # Biome sometimes nests message text
        if isinstance(description, list):
            description = " ".join(
                part.get("content", "") for part in description if isinstance(part, dict)
            )

        return StaticIssue(
            file          = os.path.relpath(file_path, repo_path) if file_path else "",
            location      = cls.get_location(diagnostic),
            rule          = biome_category,
            category      = category,
            severity      = severity,
            description   = description,
            suggested_fix = cls.get_suggested_fix(diagnostic),
            url           = cls.get_rule_url(biome_category),
        )


# ─── Runner ───────────────────────────────────────────────────────────────────

class BiomeRunner:

    def __init__(self, report_path: str = REPORT_PATH):
        self.report_path = report_path

    def run(self, repo_path: str) -> list[dict]:
        cmd = [
            "npx", "@biomejs/biome", "check",
            "--reporter=json",
            "--diagnostic-level=error",
            repo_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)

        # Biome writes JSON to stdout
        raw = result.stdout.strip()
        if not raw:
            return []

        try:
            parsed = json.loads(raw)
            # Restituiamo solo i primi 20 diagnostici per risparmiare token a monte
            diagnostics = []
            if isinstance(parsed, list):
                diagnostics = parsed
            elif isinstance(parsed, dict):
                diagnostics = parsed.get("diagnostics", [])
            
            return diagnostics[:MAX_ISSUES] # Hard limit preventivo
        except json.JSONDecodeError:
            return []       


# ─── Tool ─────────────────────────────────────────────────────────────────────

@tool
def js_ts_static_analysis(repo_path: str) -> str:
    """
    Execute static analysis on a JavaScript/TypeScript repository using Biome.
    Filters: Security, Correctness (bugs), Complexity, Performance, Suspicious patterns.
    Returns a normalized JSON report compatible with all language tools.
    """
    try:
        all_diagnostics = BiomeRunner().run(repo_path)
        mapper          = BiomeIssueMapper()

        filtered = [
            mapped.to_dict()
            for d in all_diagnostics
            if (mapped := mapper.map(d, repo_path)) is not None
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
