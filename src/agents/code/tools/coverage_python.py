import subprocess
import json
import os
from strands import tool
from tools.models import FileCoverage, CoverageReport, TestSummary

COVERAGE_REPORT_PATH = "/tmp/report_coverage_python.json"
TEST_REPORT_PATH     = "/tmp/report_tests_python.json"
TOOL_NAME            = "Coverage.py + pytest-cov"
LANGUAGE             = "python"
LOW_COVERAGE_THRESHOLD = 50.0

class CoveragePyMapper:
    @staticmethod
    def map_file(path: str, data: dict) -> FileCoverage:
        summary = data.get("summary", {}) if isinstance(data.get("summary"), dict) else {}
        missing_lines = data.get("missing_lines", []) if isinstance(data.get("missing_lines"), list) else []
        missing_branches = data.get("missing_branches", 0)
        if isinstance(missing_branches, list):
            missing_branches = len(missing_branches)

        return FileCoverage(
            file                  = path,
            line_coverage_pct     = round(float(summary.get("percent_covered", 0.0)), 2),
            branch_coverage_pct   = round(float(summary.get("percent_branches_covered", 0.0)), 2),
            function_coverage_pct = 0.0,
            missing_lines         = missing_lines,
            missing_branches      = int(missing_branches),
            total_lines           = int(summary.get("num_statements", 0)),
            total_branches        = int(summary.get("num_branches", 0)),
            total_functions       = 0,
        )

    @staticmethod
    def map_totals(totals: dict) -> tuple[float, float, float]:
        if not isinstance(totals, dict): return 0.0, 0.0, 0.0
        line_pct   = round(float(totals.get("percent_covered", 0.0)), 2)
        branch_pct = round(float(totals.get("percent_branches_covered", 0.0)), 2)
        return line_pct, branch_pct, 0.0

class PytestResultMapper:
    @staticmethod
    def map(report: dict) -> TestSummary:
        if not isinstance(report, dict): return TestSummary(0,0,0,0,0,0,0)
        summary = report.get("summary", {}) if isinstance(report.get("summary"), dict) else {}
        collected = int(report.get("collected", 0))
        return TestSummary(
            total_suites  = collected,
            passed_suites = 0,
            failed_suites = int(summary.get("failed", 0)),
            total_tests   = collected,
            passed_tests  = int(summary.get("passed", 0)),
            failed_tests  = int(summary.get("failed", 0)),
            skipped_tests = int(summary.get("skipped", 0)),
        )

class CoveragePyRunner:
    def install_dependencies(self, repo_path: str) -> None:
        pip_cmds = [
            ["pip", "install", "-r", "requirements.txt"],
            ["pip", "install", "-r", "requirements-dev.txt"],
            ["pip", "install", "-r", "dev-requirements.txt"],
            ["pip", "install", "-e", "."],
        ]
        for cmd in pip_cmds:
            req_file = os.path.join(repo_path, cmd[-1]) if cmd[-1] != "." else None
            if req_file and not os.path.exists(req_file): continue
            subprocess.run(cmd, capture_output=True, text=True, check=False, cwd=repo_path)
        subprocess.run(["pip", "install", "pytest", "pytest-cov", "coverage", "pytest-json-report", "pytest-xdist"], capture_output=True, text=True, check=False)

    def run_tests(self, repo_path: str) -> None:
        subprocess.run(
            ["coverage", "run", "--branch", "-m", "pytest", "-n", "auto", "--json-report", f"--json-report-file={TEST_REPORT_PATH}"],
            capture_output=True, text=True, check=False, cwd=repo_path,
        )

    def generate_report(self, repo_path: str) -> dict:
        subprocess.run(["coverage", "json", "-o", COVERAGE_REPORT_PATH], capture_output=True, text=True, check=False, cwd=repo_path)
        try:
            with open(COVERAGE_REPORT_PATH, "r") as f:
                parsed = json.load(f)
                return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    def load_test_results(self) -> dict:
        try:
            if os.path.exists(TEST_REPORT_PATH):
                with open(TEST_REPORT_PATH, "r") as f:
                    parsed = json.load(f)
                    return parsed if isinstance(parsed, dict) else {}
        except Exception:
            pass
        return {}

@tool
def python_coverage_analysis(repo_path: str) -> str:
    try:
        runner = CoveragePyRunner()
        runner.install_dependencies(repo_path)
        runner.run_tests(repo_path)
        
        raw_report   = runner.generate_report(repo_path)
        test_results = runner.load_test_results()

        if not raw_report:
            raise FileNotFoundError("Coverage report not generated")

        files_data = raw_report.get("files", {})
        totals     = raw_report.get("totals", {})

        file_mapper  = CoveragePyMapper()
        mapped_files = [
            file_mapper.map_file(path, data).to_dict()
            for path, data in files_data.items() if isinstance(data, dict)
        ]

        line_pct, branch_pct, fn_pct = file_mapper.map_totals(totals)

        uncovered = [
            f.get("file", "") for f in mapped_files
            if f.get("line_coverage_pct", 0) < LOW_COVERAGE_THRESHOLD
        ]

        test_summary = PytestResultMapper.map(test_results).to_dict() if test_results else None

        report = CoverageReport(
            language             = LANGUAGE,
            tool                 = TOOL_NAME,
            overall_line_pct     = line_pct,
            overall_branch_pct   = branch_pct,
            overall_function_pct = fn_pct,
            files                = mapped_files,
            test_summary         = test_summary,
            uncovered_files      = uncovered,
        )
        return json.dumps(report.to_dict())
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})