import { DocsAgentResponse } from '../../../application/DTOs/models/responses/docs-agent-response-model.model';
import { DocumentationReport } from '../../entities/documentation-report.entity';
import { ReportId } from '../../value-objects/report-id.vo';
import { AnalysisId } from '../../value-objects/analysis-id.vo';
export interface IDocsReportEntityProvider {
  fromDocsAgentResponse(
    response: DocsAgentResponse,
    reportId: ReportId,
    analysisId: AnalysisId,
  ): DocumentationReport;
}
