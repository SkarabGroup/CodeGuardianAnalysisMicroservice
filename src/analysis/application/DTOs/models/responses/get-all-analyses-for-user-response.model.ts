import { GitHubAnalysisGeneralDataDTO } from './get-github-analysis-from-id-result-model.model';

export class GetAllAnalysesForUserResponse {
  public constructor(public readonly dto: GitHubAnalysisGeneralDataDTO[]) {}
}
