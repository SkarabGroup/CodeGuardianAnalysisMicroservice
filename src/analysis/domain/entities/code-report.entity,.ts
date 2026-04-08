import { AnalysisId } from "../value-objects/analysis-id.vo";
import { CoveragePercentage } from "../value-objects/code/coverage-percentage.vo";
import { FileCoverage } from "../value-objects/code/file-coverage.vo";
import { StaticAnalysisFinding } from "../value-objects/code/static-analysis-finding.vo";

export class CodeReport {
  private constructor(
    private readonly reportId: unknown,
    private readonly analysisId: AnalysisId,
    private readonly totalLineCoverage : CoveragePercentage,
    private readonly totalBranchPercentage : CoveragePercentage,
    private readonly coverageFiles : FileCoverage[],
    private readonly staticAnalysisErrors: StaticAnalysisFinding[]
  ) {}

  public create(data: {}): CodeReport {}
}