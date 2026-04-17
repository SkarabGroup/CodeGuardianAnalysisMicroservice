import { AnalysisId } from '../../../domain/value-objects/analysis-id.vo';
import { GitHubAnalysisDetailedResult } from '../../DTOs/models/responses/get-github-analysis-from-id-result-model.model';
export interface IGetAnalysisFromIdPort {
  getAnalysisFromId(analysisId: AnalysisId): Promise<GitHubAnalysisDetailedResult | null>;
}
