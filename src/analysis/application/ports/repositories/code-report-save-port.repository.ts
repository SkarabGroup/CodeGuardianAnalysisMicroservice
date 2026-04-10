import { SaveCodeReportRequest } from '../../DTOs/models/requests/save-code-report-request-model.model';
import { SaveCodeReportResponse } from '../../DTOs/models/responses/save-code-report-response-model.model';

export interface ICodeReportSavePort {
  saveCodeReport(request: SaveCodeReportRequest): Promise<SaveCodeReportResponse>;
}
