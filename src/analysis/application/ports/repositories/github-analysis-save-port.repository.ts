import { SaveGitHubAnalysisRequest } from '../../DTOs/models/requests/save-git-analysis-request-model.model';
import { SaveGitHubAnalysisResponse } from '../../DTOs/models/responses/save-git-analysis-response-model.model';

export interface IGitHubAnalysisSavePort {
  saveAnalysis(request: SaveGitHubAnalysisRequest): Promise<SaveGitHubAnalysisResponse>;
}
