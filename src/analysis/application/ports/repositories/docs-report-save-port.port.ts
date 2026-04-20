import { SaveDocsReportRequest } from '../../DTOs/models/requests/save-docs-report-request-model.model';
import { SaveDocsReportResponse } from '../../DTOs/models/responses/save-docs-report-response-model.model';

export interface IDocsReportSavePort {
  saveDocsReport(model: SaveDocsReportRequest): Promise<SaveDocsReportResponse>;
}
