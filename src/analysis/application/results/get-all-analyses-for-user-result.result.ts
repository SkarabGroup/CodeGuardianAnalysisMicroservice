import { GitHubAnalysisGeneralDataDTO } from '../DTOs/models/responses/get-github-analysis-from-id-result-model.model';
export class GetAllAnalysesForUserResult {
  constructor(
    public readonly success: boolean,
    public readonly message?: string,
    public readonly analyses?: GitHubAnalysisGeneralDataDTO[],
  ) {}

  public static success(analyses: GitHubAnalysisGeneralDataDTO[]): GetAllAnalysesForUserResult {
    return new GetAllAnalysesForUserResult(true, undefined, analyses);
  }

  public static failure(message: string): GetAllAnalysesForUserResult {
    return new GetAllAnalysesForUserResult(false, message);
  }
}
