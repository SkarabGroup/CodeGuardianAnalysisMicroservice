import { DocsAgentResponse } from '../../application/DTOs/models/responses/docs-agent-response-model.model';
import { DocumentationReport } from '../../domain/entities/documentation-report.entity';
import { ReportId } from '../../domain/value-objects/report-id.vo';
import { AnalysisId } from '../../domain/value-objects/analysis-id.vo';
import { APIViolation } from '../../domain/value-objects/api-violation.vo';
import { DocsDiscrepancy } from '../../domain/value-objects/docs-discrepancy.vo';
import { MissingFile } from '../../domain/value-objects/missing-file.vo';
import { DependencyAudit } from '../../domain/value-objects/dependency-audit.vo';
import { PathFinding } from '../../domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../domain/value-objects/description-finding.vo';
import { ReadmeDependency } from '../../domain/value-objects/readme-dependency.vo';
import { ConfigDependency } from '../../domain/value-objects/config-dependency.vo';
import { MissingInConfigDependency } from '../../domain/value-objects/missing-in-config-dependency.vo';
import { UndocumentedDependency } from '../../domain/value-objects/undocumented-dependency.vo';
import { VersionMismatchDependency } from '../../domain/value-objects/version-mismatch-dependency.vo';
import { StatusMissing } from '../../domain/enums/status-missing.enum';
import { SeverityLevel } from '../../domain/enums/severity-level.enum';
import { IDocsReportEntityProvider } from './interfaces/docs-report-entity-provider.interface';
import { Injectable } from '@nestjs/common';

import { CodeAgentResponse } from '../../application/DTOs/models/responses/code-agent-response-model.model';
import { CodeAgentReport } from '../../domain/entities/code-agent-report.entity';
import { VerdictStatus } from '../../domain/enums/verdict-status.enum';
import { CodeAgentMetadata } from '../../domain/value-objects/code-agent-metadata.vo';
import { AIInterpretation } from '../../domain/value-objects/ai-interpretation.vo';
import { KeyIssueReasoning } from '../value-objects/key-issue-reasoning.vo';
import { IssueLocation } from '../value-objects/issue-location.vo';
import { StaticAnalysisEvaluation } from '../value-objects/static-analysis-evaluation.vo';
import { CriticalFileReasoning } from '../value-objects/critical-file-reasoning.vo';
import { CoveragePercentage } from '../value-objects/coverage-percentage.vo';
import { CoverageEvaluation } from '../value-objects/coverage-evaluation.vo';
import { ICodeReportEntityProvider } from './interfaces/code-report-entity-provider.interface';

const STATUS_MISSING_ALIASES: Record<string, StatusMissing> = {
  NOT_FOUND: StatusMissing.NOT_FOUND,
  POSSIBLY_RENAMED: StatusMissing.POSSIBLY_RENAMED,
  WRONG_PATH: StatusMissing.WRONG_PATH,
  MISSING: StatusMissing.NOT_FOUND,
  FILE_NOT_FOUND: StatusMissing.NOT_FOUND,
  RENAMED: StatusMissing.POSSIBLY_RENAMED,
  MOVED: StatusMissing.POSSIBLY_RENAMED,
  INCORRECT_PATH: StatusMissing.WRONG_PATH,
  BAD_PATH: StatusMissing.WRONG_PATH,
};

const SEVERITY_ALIASES: Record<string, SeverityLevel> = {
  LOW: SeverityLevel.LOW,
  INFO: SeverityLevel.LOW,
  HINT: SeverityLevel.LOW,
  MEDIUM: SeverityLevel.MEDIUM,
  WARNING: SeverityLevel.MEDIUM,
  HIGH: SeverityLevel.HIGH,
  ERROR: SeverityLevel.HIGH,
  CRITICAL: SeverityLevel.CRITICAL,
  FATAL: SeverityLevel.CRITICAL,
};

function normalizeStatusMissing(raw: string): StatusMissing {
  const key = (raw || '').trim().toUpperCase().replace(/[\s-]/g, '_');
  return STATUS_MISSING_ALIASES[key] ?? StatusMissing.NOT_FOUND;
}

function normalizeSeverity(raw: string): SeverityLevel {
  const key = (raw || '').trim().toUpperCase();
  return SEVERITY_ALIASES[key] ?? SeverityLevel.MEDIUM;
}

export function mapDocsAgentResponseToDocumentationReport(
  response: DocsAgentResponse,
  reportId: ReportId,
  analysisId: AnalysisId,
): DocumentationReport {
  const report = response.analysis_report;

  const apiViolations = (report.API_standard_violations || []).map((dto) =>
    APIViolation.create(
      PathFinding.create(dto.file || 'UNKNOWN'),
      dto.rule || 'UNSPECIFIED_RULE',
      SeverityFinding.create(normalizeSeverity(dto.severity)),
      DescriptionFinding.create(dto.message || 'No description provided'),
    ),
  );

  const docsDiscrepancies = (report.docs_discrepancies || []).map((dto) =>
    DocsDiscrepancy.create(
      PathFinding.create(dto.documentation_source || 'UNKNOWN'),
      dto.category || 'OTHER',
      SeverityFinding.create(normalizeSeverity(dto.severity)),
      DescriptionFinding.create(dto.docs_claim || 'No claim documented'),
      DescriptionFinding.create(dto.actual_finding || 'No finding reported'),
    ),
  );

  const missingFiles = (report.missing_files || []).map((dto) =>
    MissingFile.create(
      PathFinding.create(dto.referenced_path || 'UNKNOWN'),
      PathFinding.create(dto.referenced_in || 'UNKNOWN'),
      normalizeStatusMissing(dto.status),
      DescriptionFinding.create(dto.context || 'No context provided'),
    ),
  );

  const dependencyAudit = mapDependencyAudit(report.dependency_audit);

  return DocumentationReport.create({
    reportId,
    analysisId,
    apiViolations,
    docsDiscrepancies,
    missingFiles,
    dependencyAudit,
  });
}

function mapDependencyAudit(
  dto: import('../../application/DTOs/models/responses/docs-agent-response-model.model').DocsDependencyAuditDTO,
): DependencyAudit {
  const readmeDefined = (dto.readme_defined || []).map((entry) =>
    ReadmeDependency.create(entry.name, entry.version_pinned || null),
  );

  const configDefined = (dto.config_defined || []).map((entry) =>
    ConfigDependency.create(
      entry.name,
      entry.version_pinned,
      PathFinding.create(entry.source_file || 'package.json'),
    ),
  );

  // Rimossi i cast 'any': ora 'entry' è di tipo DocsMissingInConfigDTO
  const missingInConfig = (dto.missing_in_config || []).map((entry) =>
    MissingInConfigDependency.create(
      entry.name,
      PathFinding.create(entry.source_file || entry.documented_in || 'UNKNOWN'),
      SeverityFinding.create(normalizeSeverity(entry.severity)),
    ),
  );

  const undocumentedInReadme = (dto.undocumented_in_readme || []).map((entry) =>
    UndocumentedDependency.create(entry.name, PathFinding.create(entry.found_in || 'UNKNOWN')),
  );

  const versionMismatches = (dto.version_mismatches || [])
    .filter((entry) => entry.version_pinned !== null)
    .map((entry) =>
      VersionMismatchDependency.create(
        entry.name,
        entry.version_pinned as string,
        entry.config_version || (entry.version_pinned as string),
        PathFinding.create(entry.source_file || 'UNKNOWN'),
      ),
    );

  return DependencyAudit.create({
    readmeDefined,
    configDefined,
    missingInConfig,
    undocumentedInReadme,
    versionMismatches,
  });
}

// --------- Code Report ---------

const VERDICT_ALIASES: Record<string, VerdictStatus> = {
  CRITICAL: VerdictStatus.CRITICAL,
  POOR: VerdictStatus.POOR,
  FAIR: VerdictStatus.FAIR,
  GOOD: VerdictStatus.GOOD,
  EXCELLENT: VerdictStatus.EXCELLENT,
};

function normalizeVerdict(raw: string): VerdictStatus {
  const key = (raw || '').trim().toUpperCase();
  return VERDICT_ALIASES[key] ?? VerdictStatus.POOR;
}

export function mapCodeAgentResponseToCodeAgentReport(
  response: CodeAgentResponse,
  reportId: ReportId,
  analysisId: AnalysisId,
): CodeAgentReport {
  const report = response.analysis_report;

  const metadata = CodeAgentMetadata.create(
    report.metadata.language ?? 'UNKNOWN',
    report.metadata.status,
  );

  const interpretationDto = report.ai_interpretation;

  const keyIssuesReasoning = (
    interpretationDto.static_analysis_evaluation.key_issues_reasoning || []
  ).map((dto) =>
    KeyIssueReasoning.create(
      PathFinding.create(dto.file || 'UNKNOWN'),
      IssueLocation.create(dto.location.line_start, dto.location.line_end, dto.location.column),
      dto.rule || 'UNSPECIFIED_RULE',
      SeverityFinding.create(normalizeSeverity(dto.severity)),
      DescriptionFinding.create(dto.original_description || 'No description provided'),
      DescriptionFinding.create(dto.ai_reasoning || 'No reasoning provided'),
      DescriptionFinding.create(dto.suggested_resolution || 'No suggestion provided'),
    ),
  );

  const staticAnalysisEvaluation = StaticAnalysisEvaluation.create(
    interpretationDto.static_analysis_evaluation.total_issues_analyzed,
    keyIssuesReasoning,
  );

  const criticalFilesReasoning = (
    interpretationDto.coverage_evaluation.critical_files_reasoning || []
  ).map((dto) =>
    CriticalFileReasoning.create(
      PathFinding.create(dto.file || 'UNKNOWN'),
      CoveragePercentage.create(dto.line_coverage_pct / 100),
      dto.missing_lines || [],
      dto.missing_branches ?? 0,
      DescriptionFinding.create(dto.ai_reasoning || 'No reasoning provided'),
    ),
  );

  const coverageEvaluation = CoverageEvaluation.create(
    interpretationDto.coverage_evaluation.overall_health || 'UNKNOWN',
    criticalFilesReasoning,
  );

  const aiInterpretation = AIInterpretation.create(
    normalizeVerdict(interpretationDto.verdict),
    DescriptionFinding.create(interpretationDto.executive_summary || 'No summary provided'),
    staticAnalysisEvaluation,
    coverageEvaluation,
  );

  return CodeAgentReport.create(reportId, analysisId, metadata, aiInterpretation);
}

@Injectable()
export class ReportEntitiesProvider
  implements IDocsReportEntityProvider, ICodeReportEntityProvider
{
  public fromDocsAgentResponse(
    response: DocsAgentResponse,
    reportId: ReportId,
    analysisId: AnalysisId,
  ): DocumentationReport {
    return mapDocsAgentResponseToDocumentationReport(response, reportId, analysisId);
  }

  public fromCodeAgentResponse(
    response: CodeAgentResponse,
    reportId: ReportId,
    analysisId: AnalysisId,
  ): CodeAgentReport {
    return mapCodeAgentResponseToCodeAgentReport(response, reportId, analysisId);
  }
}

export const DOCS_REPORT_PROVIDER = Symbol('IDocsReportEntityProvider');
export const CODE_REPORT_PROVIDER = Symbol('ICodeReportEntityProvider');
