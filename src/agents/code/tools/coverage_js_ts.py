import subprocess
import json
import os
import sys
import re
from strands import tool

from tools.models import FileCoverage, CoverageReport, TestSummary


# ─── Constants ────────────────────────────────────────────────────────────────

TOOL_NAME              = "Jest/Vitest + Istanbul"
LANGUAGE               = "javascript/typescript"
LOW_COVERAGE_THRESHOLD = 50.0


# ─── Package Manager Detection ────────────────────────────────────────────────

class PackageManagerDetector:

    @staticmethod
    def detect(repo_path: str) -> str:
        if os.path.exists(os.path.join(repo_path, "pnpm-lock.yaml")):
            return "pnpm"
        if os.path.exists(os.path.join(repo_path, "yarn.lock")):
            return "yarn"
        if os.path.exists(os.path.join(repo_path, "package-lock.json")):
            return "npm"
        raise FileNotFoundError(
            "No lock file found (package-lock.json / yarn.lock / pnpm-lock.yaml). "
            "Cannot guarantee deterministic install. Please commit your lock file."
        )


# ─── Test Framework Detection ─────────────────────────────────────────────────

class TestFrameworkDetector:

    SUPPORTED = ("jest", "vitest")

    @staticmethod
    def detect(repo_path: str) -> str:
        pkg_path = os.path.join(repo_path, "package.json")
        if not os.path.exists(pkg_path):
            raise FileNotFoundError("package.json not found")

        with open(pkg_path) as f:
            pkg = json.load(f)

        all_deps = {
            **pkg.get("dependencies", {}),
            **pkg.get("devDependencies", {}),
        }
        for fw in TestFrameworkDetector.SUPPORTED:
            if fw in all_deps:
                return fw

        raise ValueError(
            "No supported test framework found in package.json. "
            "Supported frameworks: jest, vitest."
        )


# ─── Istanbul Version Resolver (for Vitest) ───────────────────────────────────

class IstanbulResolver:

    @staticmethod
    def ensure_istanbul_for_vitest(repo_path: str, pkg_manager: str) -> None:
        pkg_path = os.path.join(repo_path, "package.json")
        with open(pkg_path) as f:
            pkg = json.load(f)

        all_deps = {
            **pkg.get("dependencies", {}),
            **pkg.get("devDependencies", {}),
        }
        has_istanbul = any(
            k in all_deps for k in ("@vitest/coverage-v8", "@vitest/coverage-istanbul")
        )
        if has_istanbul:
            return

        vitest_version = all_deps.get("vitest", "latest").lstrip("^~")
        install_cmd_map = {
            "npm":  ["npm", "install", "--save-dev"],
            "yarn": ["yarn", "add", "--dev"],
            "pnpm": ["pnpm", "add", "-D"],
        }
        base_cmd = install_cmd_map.get(pkg_manager, ["npm", "install", "--save-dev"])
        subprocess.run(
            base_cmd + [f"@vitest/coverage-v8@{vitest_version}"],
            capture_output=True, text=True, check=False, cwd=repo_path,
        )


# ─── Runner ───────────────────────────────────────────────────────────────────

class JSTSCoverageRunner:

    def install_deps(self, repo_path: str, pkg_manager: str) -> None:
        install_cmds = {
            "npm":  ["npm", "ci"],
            "yarn": ["yarn", "install", "--frozen-lockfile"],
            "pnpm": ["pnpm", "install", "--frozen-lockfile"],
        }
        result = subprocess.run(
            install_cmds[pkg_manager],
            capture_output=True, text=True, check=False, cwd=repo_path,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"Dependency installation failed. Lock file may be out of sync.\n{result.stderr}"
            )

    def run_jest(self, repo_path: str) -> None:
        coverage_dir      = os.path.join(repo_path, "coverage")
        test_results_path = os.path.join(repo_path, "test-results.json")

        result = subprocess.run(
            [
                "npx", "jest",
                "--silent",
                "--coverage",
                f"--coverageDirectory={coverage_dir}",
                "--coverageReporters=json-summary",
                "--coverageReporters=json",
                "--passWithNoTests",
                "--testPathIgnorePatterns=e2e",
                "--testPathIgnorePatterns=browser",
                "--testPathIgnorePatterns=cypress",
                "--testPathIgnorePatterns=playwright",
                "--forceExit",
                "--json",
                f"--outputFile={test_results_path}",
            ],
            capture_output=True, text=True, check=False, cwd=repo_path,
        )
        print(f"[jest] exit code: {result.returncode}", file=sys.stderr)
        if result.stderr:
            print(f"[jest] stderr: {result.stderr[:800]}", file=sys.stderr)

    def run_vitest(self, repo_path: str) -> None:
        coverage_dir      = os.path.join(repo_path, "coverage")
        test_results_path = os.path.join(repo_path, "test-results.json")

        result = subprocess.run(
            [
                "npx", "vitest", "run",
                "--coverage",
                f"--coverage.reportsDirectory={coverage_dir}",
                "--coverage.reporter=json-summary",
                "--coverage.reporter=json",
                "--reporter=json",
                f"--outputFile={test_results_path}",
            ],
            capture_output=True, text=True, check=False, cwd=repo_path,
        )
        print(f"[vitest] exit code: {result.returncode}", file=sys.stderr)
        if result.stderr:
            print(f"[vitest] stderr: {result.stderr[:800]}", file=sys.stderr)

    def load_coverage_summary(self, repo_path: str) -> dict:
        coverage_dir = os.path.join(repo_path, "coverage")

        if os.path.exists(coverage_dir):
            print(f"[coverage] Contenuto coverage/: {os.listdir(coverage_dir)}", file=sys.stderr)
        else:
            print(f"[coverage] Cartella coverage/ non trovata in {repo_path}", file=sys.stderr)

        summary_path = os.path.join(coverage_dir, "coverage-summary.json")
        if os.path.exists(summary_path):
            with open(summary_path) as f:
                return json.load(f)

        raise FileNotFoundError(
            f"Coverage summary not found. Expected: {summary_path}"
        )

    def load_test_results(self, repo_path: str) -> dict:
        path = os.path.join(repo_path, "test-results.json")
        if not os.path.exists(path):
            return {}
        with open(path) as f:
            return json.load(f)


# ─── Mapper ───────────────────────────────────────────────────────────────────

class IstanbulMapper:

    @staticmethod
    def map_file(path: str, data: dict, repo_path: str) -> FileCoverage:
        lines     = data.get("lines", {})
        branches  = data.get("branches", {})
        functions = data.get("functions", {})

        return FileCoverage(
            file                  = os.path.relpath(path, repo_path) if path != "total" else "total",
            line_coverage_pct     = round(lines.get("pct", 0.0), 2),
            branch_coverage_pct   = round(branches.get("pct", 0.0), 2),
            function_coverage_pct = round(functions.get("pct", 0.0), 2),
            missing_lines         = [],
            missing_branches      = branches.get("total", 0) - branches.get("covered", 0),
            total_lines           = lines.get("total", 0),
            total_branches        = branches.get("total", 0),
            total_functions       = functions.get("total", 0),
        )

    @staticmethod
    def map_test_summary(results: dict) -> TestSummary:
        return TestSummary(
            total_suites  = results.get("numTotalTestSuites", 0),
            passed_suites = results.get("numPassedTestSuites", 0),
            failed_suites = results.get("numFailedTestSuites", 0),
            total_tests   = results.get("numTotalTests", 0),
            passed_tests  = results.get("numPassedTests", 0),
            failed_tests  = results.get("numFailedTests", 0),
            skipped_tests = results.get("numPendingTests", 0),
        )


# ─── Tool ─────────────────────────────────────────────────────────────────────

@tool
def js_ts_coverage_analysis(repo_path: str) -> str:
    """
    Execute code coverage analysis on a JavaScript/TypeScript repository.
    Supports Jest and Vitest. Detects package manager from lock file.
    Returns a normalized JSON report compatible with all language tools.
    """
    try:
        pkg_manager = PackageManagerDetector.detect(repo_path)
        framework   = TestFrameworkDetector.detect(repo_path)
        runner      = JSTSCoverageRunner()

        print(f"[coverage] pkg_manager={pkg_manager} framework={framework}", file=sys.stderr)

        runner.install_deps(repo_path, pkg_manager)

        if framework == "vitest":
            IstanbulResolver.ensure_istanbul_for_vitest(repo_path, pkg_manager)
            runner.run_vitest(repo_path)
        else:
            runner.run_jest(repo_path)

        summary      = runner.load_coverage_summary(repo_path)
        test_results = runner.load_test_results(repo_path)

        mapper = IstanbulMapper()
        total  = summary.get("total", {})
        files  = [
            mapper.map_file(path, data, repo_path).to_dict()
            for path, data in summary.items()
            if path != "total"
        ]

        uncovered = [
            f.get("file", "") for f in files
            if f.get("line_coverage_pct", 0) < LOW_COVERAGE_THRESHOLD
        ]

        test_summary = (
            mapper.map_test_summary(test_results).to_dict()
            if test_results else None
        )

        report = CoverageReport(
            language             = LANGUAGE,
            tool                 = TOOL_NAME,
            overall_line_pct     = round(total.get("lines", {}).get("pct", 0.0), 2),
            overall_branch_pct   = round(total.get("branches", {}).get("pct", 0.0), 2),
            overall_function_pct = round(total.get("functions", {}).get("pct", 0.0), 2),
            files                = files,
            test_summary         = test_summary,
            uncovered_files      = uncovered,
        )
        return json.dumps(report.to_dict())

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})
