def build_analysis_report(trivy, semgrep, grype, errors, repo_path):
  has_findings = bool(trivy or semgrep or grype)
  has_errors = bool(errors)

  if has_errors and not has_findings:
    status = "FAILED"
  else:
    status = "SUCCESS"

  return {
    "analysis_report": {
      "metadata": {
        "repository": repo_path,
        "status": status
      },
      "trivy": trivy,
      "semgrep": semgrep,
      "grype": grype,
      "errors": errors
    }
  }