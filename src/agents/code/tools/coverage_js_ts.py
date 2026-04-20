import subprocess
import json
import os
import sys
from strands import tool
from tools.models import FileCoverage, CoverageReport, TestSummary

TOOL_NAME              = "Jest/Vitest + Istanbul"
LANGUAGE               = "javascript/typescript"
LOW_COVERAGE_THRESHOLD = 50.0

class PackageManagerDetector:
    @staticmethod
    def detect(repo_path: str) -> str:
        if os.path.exists(os.path.join(repo_path, "pnpm-lock.yaml")): return "pnpm"
        if os.path.exists(os.path.join(repo_path, "yarn.lock")): return "yarn"
        if os.path.exists(os.path.join(repo_path, "package-lock.json")): return "npm"
        return "npm"

class TestFrameworkDetector:
    SUPPORTED = ("jest", "vitest")
    @staticmethod
    def detect(repo_path: str) -> str:
        pkg_path = os.path.join(repo_path, "package.json")
        if not os.path.exists(pkg_path): raise FileNotFoundError("package.json not found")
        with open(pkg_path) as f: pkg = json.load(f)
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        for fw in TestFrameworkDetector.SUPPORTED:
            if fw in all_deps: return fw
        raise ValueError("No supported test framework found.")

class IstanbulResolver:
    @staticmethod
    def ensure_istanbul_for_vitest(repo_path: str, pkg_manager: str) -> None:
        pkg_path = os.path.join(repo_path, "package.json")
        with open(pkg_path) as f: pkg = json.load(f)
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        if any(k in all_deps for k in ("@vitest/coverage-v8", "@vitest/coverage-istanbul")): return
        
        vitest_version = all_deps.get("vitest", "latest").lstrip("^~")
        install_cmd_map = {"npm": ["npm", "install", "--save-dev"], "yarn": ["yarn", "add", "--dev"], "pnpm": ["pnpm", "add", "-D"]}
        subprocess.run(install_cmd_map.get(pkg_manager, ["npm", "install", "--save-dev"]) + [f"@vitest/coverage-v8@{vitest_version}"], capture_output=True, cwd=repo_path)

class JSTSCoverageRunner:
    def install_deps(self, repo_path: str, pkg_manager: str) -> None:
        if pkg_manager == "npm" and os.path.exists(os.path.join(repo_path, "package-lock.json")):
            cmd = ["npm", "ci", "--prefer-offline"]
        else:
            cmds = {
                "npm": ["npm", "install", "--prefer-offline"], 
                "yarn": ["yarn", "install"], 
                "pnpm": ["pnpm", "install"]
            }
            cmd = cmds.get(pkg_manager, ["npm", "install", "--prefer-offline"])
            
        subprocess.run(cmd, capture_output=True, check=False, cwd=repo_path)

    def run_jest(self, repo_path: str) -> None:
        coverage_dir = os.path.join(repo_path, "coverage")
        test_results_path = os.path.join(repo_path, "test-results.json")
        subprocess.run(["npx", "jest", "--silent", "--coverage", f"--coverageDirectory={coverage_dir}", "--coverageReporters=json-summary", "--coverageReporters=json", "--passWithNoTests", "--json", f"--outputFile={test_results_path}"], capture_output=True, check=False, cwd=repo_path)

    def run_vitest(self, repo_path: str) -> None:
        coverage_dir = os.path.join(repo_path, "coverage")
        test_results_path = os.path.join(repo_path, "test-results.json")
        subprocess.run(["npx", "vitest", "run", "--coverage", f"--coverage.reportsDirectory={coverage_dir}", "--coverage.reporter=json-summary", "--coverage.reporter=json", "--reporter=json", f"--outputFile={test_results_path}"], capture_output=True, check=False, cwd=repo_path)

    def load_coverage_summary(self, repo_path: str) -> dict:
        summary_path = os.path.join(repo_path, "coverage", "coverage-summary.json")
        if os.path.exists(summary_path):
            with open(summary_path) as f: return json.load(f)
        raise FileNotFoundError("Coverage summary not found or empty.")

    def load_coverage_final(self, repo_path: str) -> dict:
        final_path = os.path.join(repo_path, "coverage", "coverage-final.json")
        if os.path.exists(final_path):
            with open(final_path) as f: return json.load(f)
        return {}

    def load_test_results(self, repo_path: str) -> dict:
        path = os.path.join(repo_path, "test-results.json")
        if os.path.exists(path):
            with open(path) as f: return json.load(f)
        return {}

class IstanbulMapper:
    @staticmethod
    def map_file(path: str, data: dict, final_data: dict, repo_path: str) -> FileCoverage:
        missing_lines = []
        if final_data:
            s_map = final_data.get("s", {})
            stmt_map = final_data.get("statementMap", {})
            for key, count in s_map.items():
                if count == 0 and str(key) in stmt_map:
                    line = stmt_map[str(key)].get("start", {}).get("line")
                    if line and line not in missing_lines:
                        missing_lines.append(int(line))
            missing_lines.sort()

        lines = data.get("lines", {}) if isinstance(data.get("lines"), dict) else {}
        branches = data.get("branches", {}) if isinstance(data.get("branches"), dict) else {}
        functions = data.get("functions", {}) if isinstance(data.get("functions"), dict) else {}
        
        return FileCoverage(
            file=os.path.relpath(path, repo_path) if path != "total" and os.path.isabs(path) else path,
            line_coverage_pct=float(lines.get("pct", 0.0)),
            branch_coverage_pct=float(branches.get("pct", 0.0)),
            function_coverage_pct=float(functions.get("pct", 0.0)),
            missing_lines=missing_lines,
            missing_branches=int(branches.get("total", 0)) - int(branches.get("covered", 0)),
            total_lines=int(lines.get("total", 0)),
            total_branches=int(branches.get("total", 0)),
            total_functions=int(functions.get("total", 0)),
        )

    @staticmethod
    def map_test_summary(results: dict) -> TestSummary:
        return TestSummary(
            total_suites=results.get("numTotalTestSuites", 0), passed_suites=results.get("numPassedTestSuites", 0), failed_suites=results.get("numFailedTestSuites", 0),
            total_tests=results.get("numTotalTests", 0), passed_tests=results.get("numPassedTests", 0), failed_tests=results.get("numFailedTests", 0), skipped_tests=results.get("numPendingTests", 0),
        )

@tool
def js_ts_coverage_analysis(repo_path: str) -> str:
    try:
        pkg_manager = PackageManagerDetector.detect(repo_path)
        framework = TestFrameworkDetector.detect(repo_path)
        runner = JSTSCoverageRunner()
        
        runner.install_deps(repo_path, pkg_manager)

        if framework == "vitest":
            IstanbulResolver.ensure_istanbul_for_vitest(repo_path, pkg_manager)
            runner.run_vitest(repo_path)
        else:
            runner.run_jest(repo_path)

        summary = runner.load_coverage_summary(repo_path)
        final_cov = runner.load_coverage_final(repo_path)
        test_results = runner.load_test_results(repo_path)

        mapper = IstanbulMapper()
        files = [
            mapper.map_file(path, data, final_cov.get(path, {}), repo_path).to_dict() 
            for path, data in summary.items() if path != "total" and isinstance(data, dict)
        ]
        
        total = summary.get("total", {}) if isinstance(summary.get("total"), dict) else {}
        test_summary = mapper.map_test_summary(test_results).to_dict() if test_results else None

        report = CoverageReport(
            language=LANGUAGE,
            tool=TOOL_NAME,
            overall_line_pct=float(total.get("lines", {}).get("pct", 0.0)),
            overall_branch_pct=float(total.get("branches", {}).get("pct", 0.0)),
            overall_function_pct=float(total.get("functions", {}).get("pct", 0.0)),
            files=files,
            test_summary=test_summary,
            uncovered_files=[f.get("file", "") for f in files if f.get("line_coverage_pct", 100) < LOW_COVERAGE_THRESHOLD]
        )
        return json.dumps(report.to_dict())

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})