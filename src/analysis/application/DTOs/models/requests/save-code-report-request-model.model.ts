import { ReportId } from '../../../../domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../domain/value-objects/analysis-id.vo';
import { CoverageFinding } from '../../../../domain/value-objects/coverage-finding.vo';
import { StaticAnalysisFinding } from '../../../../domain/value-objects/static-analysis-finding.vo';

export class SaveCodeReportRequest {
  constructor(
    public readonly reportId: ReportId,
    public readonly analysisId: AnalysisId,
    public readonly coverageFinding: CoverageFinding[],
    public readonly staticAnalysisErrors: StaticAnalysisFinding[],
  ) {}
}
