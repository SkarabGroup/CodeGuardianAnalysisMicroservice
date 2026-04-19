def build_analysis_report(trivy, semgrep, grype, errors, repo_path, status):
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