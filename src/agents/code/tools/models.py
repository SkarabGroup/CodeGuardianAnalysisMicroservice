"""
Shared normalized output models for static analysis and coverage tools.
All language-specific tools must map their output to these models to guarantee
a consistent response structure for the AI agent.
"""

from dataclasses import dataclass, asdict, field
from typing import Optional


# ─── Static Analysis Models ───────────────────────────────────────────────────

@dataclass
class IssueLocation:
    line_start: int
    line_end:   int
    column:     int


@dataclass
class StaticIssue:
    file:           str
    location:       IssueLocation
    rule:           str
    category:       str           # security | bug | complexity | refactoring | style | dry
    severity:       str           # high | medium | low | info
    description:    str
    suggested_fix:  str
    url:            str

    def to_dict(self) -> dict:
        d = asdict(self)
        d["location"] = asdict(self.location)
        return d


@dataclass
class StaticAnalysisReport:
    language:   str
    tool:       str
    issues:     list[dict]        # list of StaticIssue.to_dict()
    total:      int

    def to_dict(self) -> dict:
        return asdict(self)


# ─── Coverage Models ──────────────────────────────────────────────────────────

@dataclass
class FileCoverage:
    file:                    str
    line_coverage_pct:       float
    branch_coverage_pct:     float
    function_coverage_pct:   float
    missing_lines:           list[int]
    missing_branches:        int
    total_lines:             int
    total_branches:          int
    total_functions:         int

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class TestSummary:
    total_suites:    int
    passed_suites:   int
    failed_suites:   int
    total_tests:     int
    passed_tests:    int
    failed_tests:    int
    skipped_tests:   int

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class CoverageReport:
    language:                str
    tool:                    str
    overall_line_pct:        float
    overall_branch_pct:      float
    overall_function_pct:    float
    files:                   list[dict]    # list of FileCoverage.to_dict()
    test_summary:            Optional[dict]  # TestSummary.to_dict() or None
    uncovered_files:         list[str]     # files with 0% coverage

    def to_dict(self) -> dict:
        return asdict(self)
