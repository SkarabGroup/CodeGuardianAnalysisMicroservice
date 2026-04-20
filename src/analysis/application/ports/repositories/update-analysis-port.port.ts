import { AddReportsToAnalysisRequest } from '../../DTOs/models/requests/add-reports-request-model.model';
import { AddReportsToAnalysisResult } from '../../DTOs/models/responses/add-reports-result-model.model';

export interface IUpdateAnalysisPort {
  addReportsToAnalysis(model: AddReportsToAnalysisRequest): Promise<AddReportsToAnalysisResult>;
}
