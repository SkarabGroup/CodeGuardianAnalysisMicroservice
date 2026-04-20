import { ReportId } from '../value-objects/report-id.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { APIViolation } from '../value-objects/api-violation.vo';
import { DocsDiscrepancy } from '../value-objects/docs-discrepancy.vo';
import { MissingFile } from '../value-objects/missing-file.vo';
import { DependencyAudit } from '../value-objects/dependency-audit.vo';

export type DocumentationReportProps = {
  reportId: ReportId;
  analysisId: AnalysisId;
  apiViolations?: APIViolation[];
  docsDiscrepancies?: DocsDiscrepancy[];
  missingFiles?: MissingFile[];
  dependencyAudit?: DependencyAudit | null;
};

export class DocumentationReport {
  private constructor(
    private readonly reportId: ReportId,
    private readonly analysisId: AnalysisId,
    private readonly apiViolations: APIViolation[],
    private readonly docsDiscrepancies: DocsDiscrepancy[],
    private readonly missingFiles: MissingFile[],
    private readonly dependencyAudit: DependencyAudit | null,
  ) {}

  public static create(properties: DocumentationReportProps): DocumentationReport {
    return new DocumentationReport(
      properties.reportId,
      properties.analysisId,
      properties.apiViolations ?? [],
      properties.docsDiscrepancies ?? [],
      properties.missingFiles ?? [],
      properties.dependencyAudit ?? null,
    );
  }

  public getReportId(): ReportId {
    return this.reportId;
  }

  public getAnalysisId(): AnalysisId {
    return this.analysisId;
  }

  public getApiViolations(): APIViolation[] {
    return [...this.apiViolations];
  }

  public getDocsDiscrepancies(): DocsDiscrepancy[] {
    return [...this.docsDiscrepancies];
  }

  public getMissingFiles(): MissingFile[] {
    return [...this.missingFiles];
  }

  public getDependencyAudit(): DependencyAudit | null {
    return this.dependencyAudit;
  }

  public equals(other: DocumentationReport): boolean {
    return other instanceof DocumentationReport && this.reportId.equals(other.reportId);
  }
}
