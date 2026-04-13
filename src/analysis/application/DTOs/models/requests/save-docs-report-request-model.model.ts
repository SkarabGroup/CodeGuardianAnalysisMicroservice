import { APIViolation } from '../../../../domain/value-objects/api-violation.vo';
import { DocsDiscrepancy } from '../../../../domain/value-objects/docs-discrepancy.vo';
import { MissingFile } from '../../../../domain/value-objects/missing-file.vo';
import { DependencyAudit } from '../../../../domain/value-objects/dependency-audit.vo';
import { ReportId } from '../../../../domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../domain/value-objects/analysis-id.vo';

export class SaveDocsReportRequest {
  constructor(
    public readonly reportId: ReportId,
    public readonly analysisId: AnalysisId,
    public readonly apiViolations: APIViolation[],
    public readonly docsDiscrepancies: DocsDiscrepancy[],
    public readonly missingFiles: MissingFile[],
    public readonly dependencyAudit: DependencyAudit | null,
  ) {}
}
