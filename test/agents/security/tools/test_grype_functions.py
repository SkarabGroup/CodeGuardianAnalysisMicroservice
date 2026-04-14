import sys
import types

mock_strands = types.ModuleType("strands")

def tool(func):
    return func

mock_strands.tool = tool

sys.modules["strands"] = mock_strands

import os
import json
import subprocess
from unittest.mock import patch
from src.agents.security.tools.grype_functions import (
    parse_grype_report,
    run_syft_scan,
    run_grype_scan,
    run_grype,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def get_fixture_path(name):
    return os.path.join(FIXTURES_DIR, name)

# -------------------------
# PARSER TESTS
# -------------------------

def test_parse_grype_file_not_found():
    result = parse_grype_report("missing.json")

    assert result["error"] == "Grype report file was not found"

def test_parse_grype_invalid_json(tmp_path):
    file = tmp_path / "report.json"
    file.write_text("{ invalid json")

    result = parse_grype_report(str(file))

    assert result["error"] == "Grype report contains invalid JSON"

def test_parse_grype_empty_file(tmp_path):
    file = tmp_path / "report.json"
    file.write_text("")

    result = parse_grype_report(str(file))

    assert result["findings_to_analyze"] == []
    assert result["full_report_path"] == str(file)

def test_parse_grype_no_matches(tmp_path):
    file = tmp_path / "report.json"
    file.write_text(json.dumps({"matches": []}))

    result = parse_grype_report(str(file))

    assert result["findings_to_analyze"] == []
    assert result["full_report_path"] == str(file)

def test_parse_grype_filters_only_critical(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {"severity": "High"},
                "artifact": {}
            },
            {
                "vulnerability": {"severity": "Critical"},
                "artifact": {"name": "pkg", "version": "1.0", "locations": []}
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))

    assert len(result["findings_to_analyze"]) == 1
    assert result["findings_to_analyze"][0]["severity"] == "Critical"

def test_parse_grype_fix_fixed(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {
                    "severity": "Critical",
                    "id": "CVE-1",
                    "description": "desc",
                    "fix": {
                        "state": "fixed",
                        "versions": ["2.0.0"]
                    }
                },
                "artifact": {
                    "name": "pkg",
                    "version": "1.0",
                    "locations": [{"path": "file.js"}]
                }
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))
    finding = result["findings_to_analyze"][0]

    assert finding["fix_hint"] == "Update to version 2.0.0"

def test_parse_grype_fix_suggested(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {
                    "severity": "Critical",
                    "fix": {}
                },
                "artifact": {},
                "matchDetails": [
                    {
                        "fix": {"suggestedVersion": "3.0.0"}
                    }
                ]
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))
    finding = result["findings_to_analyze"][0]

    assert finding["fix_hint"] == "Update to version 3.0.0"

def test_parse_grype_fix_wont_fix(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {
                    "severity": "Critical",
                    "fix": {"state": "wont-fix"}
                },
                "artifact": {}
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))
    finding = result["findings_to_analyze"][0]

    assert "wont-fix" in finding["fix_hint"]

def test_parse_grype_fix_not_fixed(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {
                    "severity": "Critical",
                    "fix": {"state": "not-fixed"}
                },
                "artifact": {}
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))
    finding = result["findings_to_analyze"][0]

    assert "No fix has been released yet" in finding["fix_hint"]

def test_parse_grype_fix_default(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {
                    "severity": "Critical"
                },
                "artifact": {}
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))
    finding = result["findings_to_analyze"][0]

    assert finding["fix_hint"] == "No fix information available."

def test_parse_grype_missing_locations(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {"severity": "Critical"},
                "artifact": {"name": "pkg", "version": "1.0"}
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))
    finding = result["findings_to_analyze"][0]

    assert finding["path"] == "unknown"

def test_parse_grype_multiple_findings(tmp_path):
    file = tmp_path / "report.json"

    data = {
        "matches": [
            {
                "vulnerability": {"severity": "Critical"},
                "artifact": {"name": "a", "version": "1"}
            },
            {
                "vulnerability": {"severity": "Critical"},
                "artifact": {"name": "b", "version": "2"}
            }
        ]
    }

    file.write_text(json.dumps(data))

    result = parse_grype_report(str(file))

    assert len(result["findings_to_analyze"]) == 2


# -------------------------
# RUNNER TESTS (SYFT)
# -------------------------

@patch("subprocess.run")
def test_run_syft_success(mock_run, tmp_path):
    sbom_file = tmp_path / "sbom.json"

    def fake_run(*args, **kwargs):
        sbom_file.write_text('{"artifacts": []}')

    mock_run.side_effect = fake_run

    error = run_syft_scan("repo", str(sbom_file))

    assert error is None

@patch("subprocess.run")
def test_run_syft_timeout(mock_run):
    mock_run.side_effect = subprocess.TimeoutExpired("syft", 180)

    error = run_syft_scan("repo", "sbom.json")

    assert error["error"] == "Timeout during Syft execution"
    assert "repo_path" in error

@patch("subprocess.run")
def test_run_syft_no_output_file(mock_run, tmp_path):
    
    mock_run.return_value = None

    sbom_file = tmp_path / "missing.json"

    error = run_syft_scan("repo", str(sbom_file))

    assert error["error"] == "Syft did not produce a valid SBOM file"
    assert error["repo_path"] == "repo"

@patch("subprocess.run")
def test_run_syft_empty_file(mock_run, tmp_path):
    mock_run.return_value = None

    sbom_file = tmp_path / "empty.json"
    sbom_file.write_text("")

    error = run_syft_scan("repo", str(sbom_file))

    assert error["error"] == "Syft did not produce a valid SBOM file"

@patch("subprocess.run")
def test_run_syft_calledprocess_no_path(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "syft",
        stderr=b"No such file or directory"
    )

    error = run_syft_scan("bad_repo", "sbom.json")

    assert error["error"] == "Syft could not access the repository path"
    assert "details" in error

@patch("subprocess.run")
def test_run_syft_catalog_failure(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "syft",
        stderr=b"failed to catalog workspace"
    )

    error = run_syft_scan("repo", "sbom.json")

    assert error["error"] == "Syft failed to catalogue the repository contents"

@patch("subprocess.run")
def test_run_syft_generic_failure(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "syft",
        stderr=b"unexpected internal error"
    )

    error = run_syft_scan("repo", "sbom.json")

    assert error["error"] == "Syft execution failed"
    assert "details" in error

# -------------------------
# RUNNER TESTS (GRYPE)
# -------------------------

@patch("subprocess.run")
def test_run_grype_success(mock_run, tmp_path):
    output_file = tmp_path / "grype.json"

    def fake_run(*args, **kwargs):
        with open(output_file, "w") as f:
            f.write("data")
            f.flush()

    mock_run.side_effect = fake_run

    error = run_grype_scan("sbom.json", str(output_file))

    assert error is None

@patch("subprocess.run")
def test_run_grype_timeout(mock_run):
    mock_run.side_effect = subprocess.TimeoutExpired("grype", 250)

    error = run_grype_scan("sbom.json", "out.json")

    assert error["error"] == "Timeout during Grype execution"
    assert error["sbom_file"] == "sbom.json"

@patch("subprocess.run")
def test_run_grype_no_output_file(mock_run, tmp_path):
    mock_run.return_value = None

    sbom_file = tmp_path / "sbom.json"
    output_file = tmp_path / "missing.json"

    error = run_grype_scan(str(sbom_file), str(output_file))

    assert error["error"] == "Grype did not produce a valid report file"
    assert error["sbom_file"] == str(sbom_file)

@patch("subprocess.run")
def test_run_grype_empty_output_file(mock_run, tmp_path):
    mock_run.return_value = None

    sbom_file = tmp_path / "sbom.json"
    output_file = tmp_path / "empty.json"
    output_file.write_text("")

    error = run_grype_scan(str(sbom_file), str(output_file))

    assert error["error"] == "Grype did not produce a valid report file"

@patch("subprocess.run")
def test_run_grype_db_outdated(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "grype",
        stderr=b"vulnerability database is too old"
    )

    error = run_grype_scan("sbom.json", "out.json")

    assert "Grype vulnerability database is outdated" in error["error"]
    assert "details" in error

@patch("subprocess.run")
def test_run_grype_sbom_load_failure(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "grype",
        stderr=b"failed to load sbom file"
    )

    error = run_grype_scan("missing.json", "out.json")

    assert error["error"] == "Grype could not load the SBOM file"
    assert "sbom_file" in error

@patch("subprocess.run")
def test_run_grype_unsupported_sbom(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "grype",
        stderr=b"unsupported sbom format detected"
    )

    error = run_grype_scan("sbom.xml", "out.json")

    assert error["error"] == "Grype does not recognise the SBOM format produced by Syft"

@patch("subprocess.run")
def test_run_grype_generic_failure(mock_run):
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "grype",
        stderr=b"unexpected internal crash"
    )

    error = run_grype_scan("sbom.json", "out.json")

    assert error["error"] == "Grype execution failed"
    assert "details" in error
    

# -------------------------
# STRANDS TOOL TESTS
# -------------------------

@patch("src.agents.security.tools.grype_functions.parse_grype_report")
@patch("src.agents.security.tools.grype_functions.run_grype_scan")
@patch("src.agents.security.tools.grype_functions.run_syft_scan")
def test_run_grype_success(mock_syft, mock_grype, mock_parse):
    mock_syft.return_value = None
    mock_grype.return_value = None
    mock_parse.return_value = {
        "findings_to_analyze": [{"id": "1"}],
        "full_report_path": "raw_grype_report.json"
    }

    result = run_grype("repo")

    assert result["status"] == "success"
    assert result["findings_to_analyze"] == [{"id": "1"}]
    assert result["errors"] == []
    assert result["meta"]["report_path"] == "raw_grype_report.json"
    assert result["meta"]["sbom_path"] == "sbom.json"

@patch("src.agents.security.tools.grype_functions.run_syft_scan")
def test_run_grype_syft_error(mock_syft):
    mock_syft.return_value = {
        "error": "syft failed",
        "details": "some details",
        "repo_path": "repo"
    }

    result = run_grype("repo")

    assert result["status"] == "error"
    assert result["findings_to_analyze"] == []
    assert result["errors"][0]["type"] == "SyftError"
    assert result["errors"][0]["message"] == "syft failed"

@patch("src.agents.security.tools.grype_functions.run_grype_scan")
@patch("src.agents.security.tools.grype_functions.run_syft_scan")
def test_run_grype_grype_error(mock_syft, mock_grype):
    mock_syft.return_value = None
    mock_grype.return_value = {
        "error": "grype failed",
        "details": "db error",
        "sbom_file": "sbom.json"
    }

    result = run_grype("repo")

    assert result["status"] == "error"
    assert result["errors"][0]["type"] == "GrypeError"
    assert result["errors"][0]["message"] == "grype failed"

@patch("src.agents.security.tools.grype_functions.parse_grype_report")
@patch("src.agents.security.tools.grype_functions.run_grype_scan")
@patch("src.agents.security.tools.grype_functions.run_syft_scan")
def test_run_grype_parse_error(mock_syft, mock_grype, mock_parse):
    mock_syft.return_value = None
    mock_grype.return_value = None
    mock_parse.return_value = {
        "error": "invalid json"
    }

    result = run_grype("repo")

    assert result["status"] == "error"
    assert result["errors"][0]["type"] == "GrypeParseError"
    assert result["errors"][0]["message"] == "invalid json"

@patch("src.agents.security.tools.grype_functions.parse_grype_report")
@patch("src.agents.security.tools.grype_functions.run_grype_scan")
@patch("src.agents.security.tools.grype_functions.run_syft_scan")
def test_run_grype_success_no_findings(mock_syft, mock_grype, mock_parse):
    mock_syft.return_value = None
    mock_grype.return_value = None
    mock_parse.return_value = {
        "findings_to_analyze": [],
        "full_report_path": "raw_grype_report.json"
    }

    result = run_grype("repo")

    assert result["status"] == "success"
    assert result["findings_to_analyze"] == []
    assert result["errors"] == []