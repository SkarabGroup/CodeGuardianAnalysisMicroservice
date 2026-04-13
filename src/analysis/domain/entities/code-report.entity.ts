import { ReportId } from '../value-objects/report-id.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { CoverageFinding } from '../value-objects/coverage-finding.vo';
import { StaticAnalysisFinding } from '../value-objects/static-analysis-finding.vo';
import { CodeVerdict } from '../enums/code-verdict.enum';

export type CodeReportProps = {
  reportId: ReportId;
  analysisId: AnalysisId;
  codeVerdict?: CodeVerdict | null;
  executiveSummary?: string;
  staticAnalysisFindings?: StaticAnalysisFinding[];
  coverageFindings?: CoverageFinding[];
};

export class CodeReport {
  private constructor(
    private readonly reportId: ReportId,
    private readonly analysisId: AnalysisId,
    private readonly codeVerdict: CodeVerdict | null,
    private readonly executiveSummary: string,
    private readonly staticAnalysisFindings: StaticAnalysisFinding[],
    private readonly coverageFindings: CoverageFinding[],
  ) {}

  public static create(properties: CodeReportProps): CodeReport {
    return new CodeReport(
      properties.reportId,
      properties.analysisId,
      properties.codeVerdict ?? null,
      properties.executiveSummary ?? '',
      properties.staticAnalysisFindings ?? [],
      properties.coverageFindings ?? [],
    );
  }

  public getReportId(): ReportId {
    return this.reportId;
  }

  public getAnalysisId(): AnalysisId {
    return this.analysisId;
  }

  public getCoverageFindings(): CoverageFinding[] {
    return [...this.coverageFindings];
  }

  public getStaticAnalysisFindings(): StaticAnalysisFinding[] {
    return [...this.staticAnalysisFindings];
  }

  public getCodeVerdict(): CodeVerdict | null {
    return this.codeVerdict;
  }

  public getExecutiveSummary(): string {
    return this.executiveSummary;
  }

  public equals(other: CodeReport): boolean {
    return other instanceof CodeReport && this.reportId.equals(other.reportId);
  }
}