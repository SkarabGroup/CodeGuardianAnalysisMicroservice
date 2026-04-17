from dataclasses import dataclass, asdict
from typing import Optional

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
    category:       str
    severity:       str
    description:    str
    suggested_fix:  str
    url:            str

    def to_dict(self) -> dict:
        return asdict(self)

@dataclass
class StaticAnalysisReport:
    language:           str
    tool:               str
    issues:             list[dict]
    total:              int

    def to_dict(self) -> dict:
        return asdict(self)

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
    files:                   list[dict]
    test_summary:            Optional[dict]
    uncovered_files:         list[str]

    def to_dict(self) -> dict:
        return asdict(self)