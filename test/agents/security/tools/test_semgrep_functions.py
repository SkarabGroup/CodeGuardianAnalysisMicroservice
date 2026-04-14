import sys
import types

# Mock del modulo strands
mock_strands = types.ModuleType("strands")

def tool(func):
    return func

mock_strands.tool = tool

sys.modules["strands"] = mock_strands

import os
import json
import subprocess
from unittest.mock import patch
from src.agents.security.tools.semgrep_functions import (
    parse_semgrep_report,
    run_semgrep_scan,
    run_semgrep,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def get_fixture_path(name):
    return os.path.join(FIXTURES_DIR, name)

# -------------------------
# PARSER TESTS
# -------------------------

def test_parser_valid():
    result = parse_semgrep_report(get_fixture_path("semgrep_valid.json"))

    assert len(result["findings_to_analyze"]) == 1
    finding = result["findings_to_analyze"][0]

    assert finding["rule_id"] == "python.lang.security.audit.eval"
    assert finding["severity"] == "ERROR"
    assert "Injection" in finding["owasp_category"]


def test_parser_empty():
    result = parse_semgrep_report(get_fixture_path("semgrep_empty.json"))

    assert result["findings_to_analyze"] == []
    assert result["scan_errors"] == []


def test_parser_with_errors():
    result = parse_semgrep_report(get_fixture_path("semgrep_error.json"))

    assert len(result["scan_errors"]) == 1
    assert result["scan_errors"][0]["type"] == "SemgrepError"

def test_parser_with_errors_file_not_found():
    result = parse_semgrep_report("nonexistent.json")

    assert "error" in result

def test_parser_invalid_json(tmp_path):
    file = tmp_path / "bad.json"
    file.write_text("not json")

    result = parse_semgrep_report(str(file))

    assert "error" in result

def test_parser_skips_non_error(tmp_path):
    result = parse_semgrep_report(get_fixture_path("semgrep_warning.json"))

    assert len(result["findings_to_analyze"]) == 0

def test_parser_no_owasp():
    result = parse_semgrep_report(get_fixture_path("semgrep_no_owasp.json"))

    assert len(result["findings_to_analyze"]) == 0


# -------------------------
# RUNNER TESTS (MOCK)
# -------------------------

@patch("subprocess.run")
def test_run_semgrep_success(mock_run, tmp_path):
    output_file = tmp_path / "report.json"

    output_file.write_text('{"results": [], "errors": []}')

    error = run_semgrep_scan("repo", str(output_file))

    assert error is None


@patch("subprocess.run")
def test_run_semgrep_timeout(mock_run):
    mock_run.side_effect = subprocess.TimeoutExpired("cmd", 10)

    error = run_semgrep_scan("repo", "out.json")

    assert "Timeout" in error["error"]

@patch("subprocess.run")
@patch("os.remove")
def test_run_semgrep_failure(mock_remove, mock_run, tmp_path):
    mock_run.side_effect = subprocess.CalledProcessError(1, "cmd")

    output_file = tmp_path / "report.json"
    output_file.write_text('{"errors": [{"type": "X"}]}')

    error = run_semgrep_scan("repo", str(output_file))

    assert "semgrep_errors" in error

@patch("subprocess.run")
@patch("os.remove")
def test_run_semgrep_failure_invalid_json(mock_remove, mock_run, tmp_path):
    mock_run.side_effect = subprocess.CalledProcessError(1, "cmd")

    output_file = tmp_path / "report.json"
    output_file.write_text("INVALID JSON")

    error = run_semgrep_scan("repo", str(output_file))

    assert error["semgrep_errors"] == []

@patch("subprocess.run")
def test_run_semgrep_failure_no_file(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(1, "cmd")

    error = run_semgrep_scan("repo", "nonexistent.json")

    assert "details" in error


# -------------------------
# STRANDS TOOL TESTS
# -------------------------

@patch("src.agents.security.tools.semgrep_functions.run_semgrep_scan")
@patch("src.agents.security.tools.semgrep_functions.parse_semgrep_report")
def test_run_semgrep_tool(mock_parse, mock_run):
    mock_run.return_value = None
    mock_parse.return_value = {"ok": True}

    result = run_semgrep("repo")

    assert result["status"] == "success"
    assert "findings_to_analyze" in result
    assert "errors" in result

@patch("src.agents.security.tools.semgrep_functions.run_semgrep_scan")
def test_run_semgrep_tool_error(mock_run):
    mock_run.return_value = {"error": "fail"}

    result = run_semgrep("repo")

    assert result["status"] == "error"
    assert result["errors"][0]["type"] == "SemgrepError"

@patch("src.agents.security.tools.semgrep_functions.run_semgrep_scan")
@patch("src.agents.security.tools.semgrep_functions.parse_semgrep_report")
def test_run_semgrep_parser_error(mock_parse, mock_run):
    mock_run.return_value = None

    mock_parse.return_value = {"error": "broken json"}

    result = run_semgrep("repo")

    assert result["status"] == "error"
    assert result["errors"][0]["type"] == "SemgrepParseError"