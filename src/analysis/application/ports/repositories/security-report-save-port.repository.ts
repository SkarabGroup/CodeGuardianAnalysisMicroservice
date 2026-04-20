import { SaveSecurityReportRequest } from '../../DTOs/models/requests/save-security-report-request-model.model';
import { SaveSecurityReportResponse } from '../../DTOs/models/responses/save-security-report-response-model.model';

export interface ISecurityReportSavePort {
  saveSecurityReport(model: SaveSecurityReportRequest): Promise<SaveSecurityReportResponse>;
}
