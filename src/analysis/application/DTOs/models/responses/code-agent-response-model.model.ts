export interface AgentMetadataDTO {
  language?: string;
  status: string;
}

export interface AgentStaticIssueLocationDTO {
  line_start: number;
  line_end: number;
  column: number;
}

export interface AgentStaticIssueDTO {
  file: string;
  location: AgentStaticIssueLocationDTO;
  rule: string;
  category: string;
  severity: string;
  description: string;
  suggested_fix: string;
  url: string;
}

export interface AgentStaticAnalysisDTO {
  language: string;
  tool: string;
  total: number;
  issues: AgentStaticIssueDTO[];
}

export interface AgentFileCoverageDTO {
  file: string;
  line_coverage_pct: number;
  branch_coverage_pct: number;
  function_coverage_pct: number;
  missing_lines: number[];
  missing_branches: number;
  total_lines: number;
  total_branches: number;
  total_functions: number;
}

export interface AgentTestSummaryDTO {
  total_suites: number;
  passed_suites: number;
  failed_suites: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
}

export interface AgentCoverageDTO {
  language: string;
  tool: string;
  overall_line_pct: number;
  overall_branch_pct: number;
  overall_function_pct: number;
  files: AgentFileCoverageDTO[];
  test_summary: AgentTestSummaryDTO | null;
  uncovered_files: string[];
}

export interface AIKeyIssueReasoningDTO {
  file: string;
  location: AgentStaticIssueLocationDTO;
  rule: string;
  severity: string;
  original_description: string;
  ai_reasoning: string;
  suggested_resolution: string;
}

export interface AICriticalFileReasoningDTO {
  file: string;
  line_coverage_pct: number;
  missing_lines: number[];
  missing_branches: number;
  ai_reasoning: string;
}

export interface AIInterpretationDTO {
  verdict: string;
  executive_summary: string;
  static_analysis_evaluation: {
    total_issues_analyzed: number;
    key_issues_reasoning: AIKeyIssueReasoningDTO[];
  };
  coverage_evaluation: {
    overall_health: string;
    critical_files_reasoning: AICriticalFileReasoningDTO[];
  };
}

export interface CodeAgentResponsePayload {
  metadata: AgentMetadataDTO;
  static_analysis?: AgentStaticAnalysisDTO;
  coverage?: AgentCoverageDTO;
  ai_interpretation: AIInterpretationDTO;
}

export class CodeAgentResponse {
  public readonly metadata: AgentMetadataDTO;
  public readonly static_analysis?: AgentStaticAnalysisDTO;
  public readonly coverage?: AgentCoverageDTO;
  public readonly ai_interpretation: AIInterpretationDTO;

  constructor(data: CodeAgentResponsePayload) {
    this.metadata = data.metadata;
    if (data.static_analysis) this.static_analysis = data.static_analysis;
    if (data.coverage) this.coverage = data.coverage;
    this.ai_interpretation = data.ai_interpretation;
  }
}
