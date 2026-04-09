import os
import json
import pytest
from unittest.mock import patch, mock_open
from tools.python_analyzer import run_python_analysis

# Mock dei dati restituiti da Ruff (simulazione)
MOCK_RUFF_JSON = [
    {
        "code": "F401", 
        "filename": "/app/repo/main.py", 
        "location": {"row": 10, "column": 5},
        "message": "os imported but unused",
        "fix": {"content": ""}
    }
]

# Mock dei dati restituiti da Coverage.py (simulazione)
MOCK_COVERAGE_JSON = {
    "totals": {
        "percent_covered": 85.5,
        "missing_lines": 12,
        "missing_branches": 2
    },
    "files": {
        "main.py": {
            "summary": {
                "missing_branches": 2,
                "missing_lines": 5,
                "percent_branches_covered": 50.0
            },
            "missing_lines": [15, 16, 17, 18, 19]
        }
    }
}

@patch("subprocess.run")
@patch("os.path.exists", return_value=True)
def test_python_analyzer_data_compression(mock_exists, mock_subprocess):
    """
    Testa che il tool estragga solo i dati utili dai JSON giganti,
    garantendo che l'LLM non venga inondato da dati inutili.
    """
    # Usiamo mock_open per simulare la lettura dei file JSON
    mock_file_content = mock_open()
    
    # Configura il mock per restituire JSON diversi a seconda del file aperto
    def side_effect(*args, **kwargs):
        if "report_Python.json" in args[0]:
            return mock_open(read_data=json.dumps(MOCK_RUFF_JSON)).return_value
        elif "report_Coverage_Python.json" in args[0]:
            return mock_open(read_data=json.dumps(MOCK_COVERAGE_JSON)).return_value
        return mock_open(read_data="").return_value
        
    with patch("builtins.open", side_effect=side_effect):
        result = run_python_analysis("/fake/dir")
        
        # VERIFICHE RUFF
        assert result["static_analysis"]["total_issues"] == 1
        # Assicuriamoci che il campo "fix" (spesso enorme) non venga passato all'agente
        assert "fix" not in result["static_analysis"]["issues"][0]
        assert result["static_analysis"]["issues"][0]["code"] == "F401"
        assert result["static_analysis"]["issues"][0]["line"] == 10
        
        # VERIFICHE COVERAGE
        assert result["coverage"]["status"] == "success"
        assert result["coverage"]["totals"]["percent_covered"] == 85.5
        assert len(result["coverage"]["files_with_missing_branches"]) == 1
        
        # Verifica che il file con rami mancanti sia stato identificato correttamente
        file_issue = result["coverage"]["files_with_missing_branches"][0]
        assert file_issue["file"] == "main.py"
        assert file_issue["missing_lines"] == [15, 16, 17, 18, 19]