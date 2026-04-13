import subprocess
import json
import os
from strands import tool
from tools.models import StaticIssue, IssueLocation, StaticAnalysisReport

MAX_ISSUES      = 100
TOOL_NAME       = "Biome"
LANGUAGE        = "javascript/typescript"
BIOME_DOCS_BASE = "https://biomejs.dev/linter/rules"

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2, "info": 3}
CATEGORY_MAP = {
    "lint/security":    ("security",    "high"),
    "lint/correctness": ("bug",         "high"),
    "lint/complexity":  ("complexity",  "medium"),
    "lint/suspicious":  ("bug",         "high"),
    "lint/performance": ("bug",         "medium"),
    "lint/style":       ("style",       "low"),
    "lint/nursery":     ("refactoring", "low"),
}
BIOME_SEVERITY_MAP = {"error": "high", "warning": "medium", "info": "low"}

class BiomeIssueMapper:
    @staticmethod
    def get_category_and_severity(biome_category: str, biome_severity: str) -> tuple[str, str]:
        for prefix, (category, sev) in CATEGORY_MAP.items():
            if biome_category.startswith(prefix):
                return category, sev
        return "style", BIOME_SEVERITY_MAP.get(biome_severity, "info")

    @staticmethod
    def get_location(diagnostic: dict) -> IssueLocation:
        loc = diagnostic.get("location")
        if not isinstance(loc, dict):
            return IssueLocation(line_start=0, line_end=0, column=0)
        
        start = loc.get("start")
        start = start if isinstance(start, dict) else {}
        end = loc.get("end")
        end = end if isinstance(end, dict) else start
        
        return IssueLocation(
            line_start=start.get("line", 0),
            line_end=end.get("line", start.get("line", 0)),
            column=start.get("column", 0)
        )

    @staticmethod
    def get_suggested_fix(diagnostic: dict) -> str:
        advices_data = diagnostic.get("advices")
        advices = []
        if isinstance(advices_data, dict):
            advices = advices_data.get("advices", [])
        elif isinstance(advices_data, list):
            advices = advices_data

        if isinstance(advices, list):
            for a in advices:
                if isinstance(a, dict) and a.get("tag") == "fix":
                    diff = a.get("diff")
                    if isinstance(diff, dict):
                        return diff.get("dict", "Code fix available")
        return "No automatic fix available"

    @classmethod
    def map(cls, diagnostic: dict, repo_path: str) -> StaticIssue | None:
        if not isinstance(diagnostic, dict): return None
        
        cat_raw = str(diagnostic.get("category", ""))
        if not any(cat_raw.startswith(p) for p in CATEGORY_MAP): return None
        
        category, severity = cls.get_category_and_severity(cat_raw, str(diagnostic.get("severity", "")))
        
        loc = diagnostic.get("location")
        file_path = ""
        if isinstance(loc, dict):
            path_data = loc.get("path", "")
            file_path = path_data.get("file", "") if isinstance(path_data, dict) else str(path_data)
        
        msg_parts = diagnostic.get("message", "")
        if isinstance(msg_parts, list):
            description = " ".join(str(p.get("content", "")) for p in msg_parts if isinstance(p, dict))
        else:
            description = str(msg_parts)
        
        return StaticIssue(
                    file=os.path.relpath(file_path, repo_path) if file_path else "unknown",
                    location=cls.get_location(diagnostic),
                    rule=cat_raw,
                    category=category,
                    severity=severity,
                    description=description,
                    suggested_fix=cls.get_suggested_fix(diagnostic),
                    url=f"{BIOME_DOCS_BASE}/{cat_raw.split('/')[-1]}"
                )  

@tool
def js_ts_static_analysis(repo_path: str) -> str:
    try:
        cmd = ["npx", "--yes", "@biomejs/biome", "check", "--reporter=json", repo_path]
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        
        stdout_raw = result.stdout.strip()
        
        idx_array = stdout_raw.find('[')
        idx_obj = stdout_raw.find('{')
        
        valid_starts = [i for i in (idx_array, idx_obj) if i != -1]
        
        if not valid_starts:
            data = []
        else:
            start_idx = min(valid_starts)
            try:
                data = json.loads(stdout_raw[start_idx:])
            except json.JSONDecodeError:
                data = []

        if isinstance(data, list):
            diagnostics = data
        elif isinstance(data, dict):
            diagnostics = data.get("diagnostics", [])
        else:
            diagnostics = []
            
        mapper = BiomeIssueMapper()
        mapped = []
        if isinstance(diagnostics, list):
            for d in diagnostics:
                if isinstance(d, dict):
                    m = mapper.map(d, repo_path)
                    if m: mapped.append(m.to_dict())
                    
        mapped_sorted = sorted(mapped, key=lambda x: SEVERITY_ORDER.get(x["severity"], 99))

        report = StaticAnalysisReport(
            language=LANGUAGE, tool=TOOL_NAME, issues=mapped_sorted[:MAX_ISSUES], total=len(mapped)
        )
        return json.dumps(report.to_dict())
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})