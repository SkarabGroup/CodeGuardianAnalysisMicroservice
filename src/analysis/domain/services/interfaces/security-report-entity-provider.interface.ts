import { SecAgentResponse } from '../../../application/DTOs/models/responses/security-agent-response-model.model';
import { SecurityReport } from '../../entities/security-report.entity';
import { ReportId } from '../../value-objects/report-id.vo';
import { AnalysisId } from '../../value-objects/analysis-id.vo';
export interface ISecurityReportEntityProvider {
  fromSecurityAgentResponse(
    response: SecAgentResponse,
    reportId: ReportId,
    analysisId: AnalysisId,
  ): SecurityReport;
}
