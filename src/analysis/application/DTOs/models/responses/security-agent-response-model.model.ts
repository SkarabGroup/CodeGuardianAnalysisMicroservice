export interface SecAgentMetadataDTO {
  repository: string;
  status: string;
}

export interface SecTrivyFindingDTO {
  rule_id: string;
  path: string;
  line: number;
  severity: string;
  description: string;
  secret_category: string;
  remediation: string;
}

export interface SecSemgrepFindingDTO {
  rule_id: string;
  path: string;
  line: number;
  severity: string;
  description: string;
  owasp_category: string;
  remediation: string;
}

export interface SecGrypeFindingDTO {
  path: string;
  package_name: string;
  package_version: string;
  vulnerability_id: string;
  severity: string;
  description: string;
  remediation: string;
}

export interface SecToolErrorDTO {
  tool: string;
  description: string;
}

export interface SecAnalysisReportDTO {
  metadata: SecAgentMetadataDTO;
  trivy: SecTrivyFindingDTO[];
  semgrep: SecSemgrepFindingDTO[];
  grype: SecGrypeFindingDTO[];
  errors: SecToolErrorDTO[];
}

export interface SecAgentResponsePayload {
  analysis_report: SecAnalysisReportDTO;
}

export class SecAgentResponse {
  public readonly analysis_report: SecAnalysisReportDTO;

  constructor(data: SecAgentResponsePayload) {
    this.analysis_report = data.analysis_report;
  }
}
