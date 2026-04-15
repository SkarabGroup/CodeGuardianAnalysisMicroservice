import { CodeAgentResponse } from '../../../application/DTOs/models/responses/code-agent-response-model.model';
import { CodeAgentReport } from '../../entities/code-agent-report.entity';
import { ReportId } from '../../value-objects/report-id.vo';
import { AnalysisId } from '../../value-objects/analysis-id.vo';
export interface ICodeReportEntityProvider {
  fromCodeAgentResponse(
    response: CodeAgentResponse,
    reportId: ReportId,
    analysisId: AnalysisId,
  ): CodeAgentReport;
}
