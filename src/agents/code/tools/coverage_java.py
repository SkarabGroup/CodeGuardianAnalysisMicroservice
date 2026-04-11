import subprocess
import json
import os
import xml.etree.ElementTree as ET
from strands import tool

from tools.models import FileCoverage, CoverageReport, TestSummary


# ─── Constants ────────────────────────────────────────────────────────────────

JACOCO_REPORT_RELATIVE = "target/site/jacoco/jacoco.xml"
TOOL_NAME              = "JaCoCo + Maven"
LANGUAGE               = "java"
LOW_COVERAGE_THRESHOLD = 50.0
JACOCO_VERSION         = "0.8.12"


# ─── JaCoCo Strategy ─────────────────────────────────────────────────────────

class JaCoCoStrategy:

    @staticmethod
    def has_jacoco(pom_path: str) -> bool:
        with open(pom_path) as f:
            return "jacoco-maven-plugin" in f.read()

    @staticmethod
    def build_command(has_plugin: bool) -> list[str]:
        if has_plugin:
            return ["mvn", "clean", "test", "jacoco:report"]
        return [
            "mvn", "clean",
            f"org.jacoco:jacoco-maven-plugin:{JACOCO_VERSION}:prepare-agent",
            "test",
            f"org.jacoco:jacoco-maven-plugin:{JACOCO_VERSION}:report",
        ]


# ─── Runner ───────────────────────────────────────────────────────────────────

class JaCoCoRunner:

    def run(self, repo_path: str) -> str:
        pom_path = os.path.join(repo_path, "pom.xml")
        if not os.path.exists(pom_path):
            raise FileNotFoundError("pom.xml not found — only Maven projects are supported")

        has_plugin = JaCoCoStrategy.has_jacoco(pom_path)
        cmd        = JaCoCoStrategy.build_command(has_plugin)

        result = subprocess.run(
            cmd, capture_output=True, text=True, check=False, cwd=repo_path,
        )
        if result.returncode != 0:
            # Surface Maven errors clearly
            raise RuntimeError(f"Maven build failed:\n{result.stderr[-2000:]}")

        report_path = os.path.join(repo_path, JACOCO_REPORT_RELATIVE)
        if not os.path.exists(report_path):
            raise FileNotFoundError(
                f"JaCoCo report not found at {report_path}. "
                "Ensure tests are configured and JaCoCo executed successfully."
            )
        return report_path


# ─── Mapper ───────────────────────────────────────────────────────────────────

class JaCoCoMapper:

    @staticmethod
    def _pct(covered: int, missed: int) -> float:
        total = covered + missed
        return round((covered / total * 100) if total > 0 else 0.0, 2)

    @staticmethod
    def _counter(element: ET.Element, counter_type: str) -> tuple[int, int]:
        """Returns (covered, missed) for a given counter type."""
        for counter in element.findall("counter"):
            if counter.get("type") == counter_type:
                return int(counter.get("covered", 0)), int(counter.get("missed", 0))
        return 0, 0

    @classmethod
    def map_file(cls, package_name: str, sourcefile: ET.Element) -> FileCoverage:
        name = sourcefile.get("name", "")
        path = f"{package_name}/{name}".replace("//", "/")

        line_cov, line_miss     = cls._counter(sourcefile, "LINE")
        branch_cov, branch_miss = cls._counter(sourcefile, "BRANCH")
        method_cov, method_miss = cls._counter(sourcefile, "METHOD")

        missing_lines = [
            int(line.get("nr", 0))
            for line in sourcefile.findall("line")
            if line.get("mi", "0") != "0"
        ]

        return FileCoverage(
            file                  = path,
            line_coverage_pct     = cls._pct(line_cov, line_miss),
            branch_coverage_pct   = cls._pct(branch_cov, branch_miss),
            function_coverage_pct = cls._pct(method_cov, method_miss),
            missing_lines         = missing_lines,
            missing_branches      = branch_miss,
            total_lines           = line_cov + line_miss,
            total_branches        = branch_cov + branch_miss,
            total_functions       = method_cov + method_miss,
        )

    @classmethod
    def map_report(cls, report_path: str) -> tuple[list[dict], float, float, float]:
        tree    = ET.parse(report_path)
        root    = tree.getroot()
        files   = []

        for package in root.findall("package"):
            pkg_name = package.get("name", "")
            for sourcefile in package.findall("sourcefile"):
                files.append(cls.map_file(pkg_name, sourcefile).to_dict())

        # Overall totals from root counters
        line_cov, line_miss     = cls._counter(root, "LINE")
        branch_cov, branch_miss = cls._counter(root, "BRANCH")
        method_cov, method_miss = cls._counter(root, "METHOD")

        return (
            files,
            cls._pct(line_cov, line_miss),
            cls._pct(branch_cov, branch_miss),
            cls._pct(method_cov, method_miss),
        )


# ─── Tool ─────────────────────────────────────────────────────────────────────

@tool
def java_coverage_analysis(repo_path: str) -> str:
    """
    Execute code coverage analysis on a Java Maven repository using JaCoCo.
    Detects if JaCoCo plugin is already configured; otherwise injects it dynamically.
    Returns a normalized JSON report compatible with all language tools.
    """
    try:
        runner      = JaCoCoRunner()
        report_path = runner.run(repo_path)

        mapper = JaCoCoMapper()
        files, line_pct, branch_pct, fn_pct = mapper.map_report(report_path)

        uncovered = [
            f.get("file", "") for f in files
            if f.get("line_coverage_pct", 0) < LOW_COVERAGE_THRESHOLD
        ]

        report = CoverageReport(
            language             = LANGUAGE,
            tool                 = TOOL_NAME,
            overall_line_pct     = line_pct,
            overall_branch_pct   = branch_pct,
            overall_function_pct = fn_pct,
            files                = files,
            test_summary         = None,  # JaCoCo doesn't expose test counts
            uncovered_files      = uncovered,
        )
        return json.dumps(report.to_dict())

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})
