export interface DocsAgentMetadataDTO {
  repository: string;
  status: string;
}

export interface DocsApiViolationDTO {
  file: string;
  rule: string;
  severity: string;
  message: string;
}

export interface DocsDiscrepancyDTO {
  category: string;
  documentation_source: string;
  docs_claim: string;
  actual_finding: string;
  severity: string;
}

export interface DocsMissingFileDTO {
  referenced_path: string;
  referenced_in: string;
  context: string;
  status: string;
}

export interface DocsDependencyEntryDTO {
  name: string;
  version_pinned: string | null;
  source_file: string;
}

export interface DocsUndocumentedDependencyDTO {
  name: string;
  found_in: string;
}

export interface DocsDependencyAuditDTO {
  readme_defined: DocsDependencyEntryDTO[];
  config_defined: DocsDependencyEntryDTO[];
  missing_in_config: DocsDependencyEntryDTO[];
  undocumented_in_readme: DocsUndocumentedDependencyDTO[];
  version_mismatches: DocsDependencyEntryDTO[];
}

export interface DocsAnalysisReportDTO {
  metadata: DocsAgentMetadataDTO;
  API_standard_violations: DocsApiViolationDTO[];
  docs_discrepancies: DocsDiscrepancyDTO[];
  missing_files: DocsMissingFileDTO[];
  dependency_audit: DocsDependencyAuditDTO;
}

export interface DocsAgentResponsePayload {
  analysis_report: DocsAnalysisReportDTO;
}

export class DocsAgentResponse {
  public readonly analysis_report: DocsAnalysisReportDTO;

  constructor(data: DocsAgentResponsePayload) {
    this.analysis_report = data.analysis_report;
  }
}
