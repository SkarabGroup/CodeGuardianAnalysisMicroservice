from helpers.raw_parsers.raw_trivy_parser import parse_trivy_report
from helpers.raw_parsers.raw_semgrep_parser import parse_semgrep_report
from helpers.raw_parsers.raw_grype_parser import parse_grype_report
from helpers.aggregators.semgrep_aggregator import merge_semgrep_findings
from helpers.aggregators.trivy_aggregator import merge_trivy_findings
from helpers.aggregators.grype_aggregator import merge_grype_findings
from helpers.report_builder import build_analysis_report

RAW_TRIVY_FILE = "/app/raw_trivy_report.json"
RAW_SEMGREP_FILE = "/app/raw_semgrep_report.json"
RAW_GRYPE_FILE = "/app/raw_grype_report.json"

def _extract_raw_findings(parsed_result: dict, errors: list) -> list:
  if "error" in parsed_result:
    errors.append(parsed_result["error"])
    return []
  
  return parsed_result.get("raw_findings", [])

def aggregate_findings(agent_report: dict, repo_path: str) -> dict: 
  agent_trivy  = agent_report.get("trivy", [])
  agent_semgrep = agent_report.get("semgrep", [])
  agent_grype  = agent_report.get("grype", [])

  errors = list(agent_report.get("errors", []))

  parsed_raw_trivy = parse_trivy_report(RAW_TRIVY_FILE)
  parsed_raw_semgrep = parse_semgrep_report(RAW_SEMGREP_FILE, repo_path)
  parsed_raw_grype = parse_grype_report(RAW_GRYPE_FILE, repo_path)

  raw_trivy = _extract_raw_findings(parsed_raw_trivy, errors)
  raw_semgrep = _extract_raw_findings(parsed_raw_semgrep, errors)
  raw_grype = _extract_raw_findings(parsed_raw_grype, errors)

  final_trivy = merge_trivy_findings(raw_trivy, agent_trivy)
  final_semgrep = merge_semgrep_findings(raw_semgrep, agent_semgrep)
  final_grype = merge_grype_findings(raw_grype, agent_grype)

  if not final_grype and not final_semgrep and final_trivy and errors:
    status = 'failure'

  else:
    status = 'success'

  return build_analysis_report(
    final_trivy,
    final_semgrep,
    final_grype,
    errors,
    repo_path,
    status
  )