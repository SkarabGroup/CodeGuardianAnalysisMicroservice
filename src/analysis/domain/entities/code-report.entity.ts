import { ReportId } from '../value-objects/report-id.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { CoverageFinding } from '../value-objects/coverage-finding.vo';
import { StaticAnalysisFinding } from '../value-objects/static-analysis-finding.vo';

export type CodeReportProps = {
  reportId: ReportId;
  analysisId: AnalysisId;
  coverageFinding: CoverageFinding[];
  staticAnalysisErrors: StaticAnalysisFinding[];
};

export class CodeReport {
  private constructor(
    private readonly reportId: ReportId,
    private readonly analysisId: AnalysisId,
    private readonly coverageFinding: CoverageFinding[],
    private readonly staticAnalysisErrors: StaticAnalysisFinding[],
  ) {}

  public static create(properties: CodeReportProps): CodeReport {
    return new CodeReport(
      properties.reportId,
      properties.analysisId,
      properties.coverageFinding ?? [],
      properties.staticAnalysisErrors ?? [],
    );
  }

  public getReportId(): ReportId {
    return this.reportId;
  }

  public getAnalysisId(): AnalysisId {
    return this.analysisId;
  }

  public getCoverageFinding(): CoverageFinding[] {
    return [...this.coverageFinding];
  }

  public getStaticAnalysisErrors(): StaticAnalysisFinding[] {
    return [...this.staticAnalysisErrors];
  }

  public equals(other: CodeReport): boolean {
    return other instanceof CodeReport && this.reportId.equals(other.reportId);
  }
}
