import { ReportId } from '../value-objects/report-id.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { DocumentationFinding } from '../value-objects/documentation-finding.vo';

export type DocumentationReportProps = {
  reportId: ReportId;
  analysisId: AnalysisId;
  documentationFindings: DocumentationFinding[];
  // TODO: add more properties if needed
};

export class DocumentationReport {
  private constructor(
    private readonly reportId: ReportId,
    private readonly analysisId: AnalysisId,
    private readonly documentationFindings: DocumentationFinding[],
    // TODO: add attribute for other Documentation properties
  ) {}

  public static create(properties: DocumentationReportProps): DocumentationReport {
    return new DocumentationReport(
      properties.reportId,
      properties.analysisId,
      properties.documentationFindings ?? [],
    );
  }

  public getReportId(): ReportId {
    return this.reportId;
  }

  public getAnalysisId(): AnalysisId {
    return this.analysisId;
  }

  public getDocumentationFindings(): DocumentationFinding[] {
    return [...this.documentationFindings];
  }

  public equals(other: DocumentationReport): boolean {
    return other instanceof DocumentationReport && this.reportId.equals(other.reportId);
  }
}
