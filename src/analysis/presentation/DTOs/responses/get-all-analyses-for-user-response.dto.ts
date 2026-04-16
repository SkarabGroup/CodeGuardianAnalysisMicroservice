import { GitHubAnalysisGeneralDataDTO } from '../../../application/DTOs/models/responses/get-github-analysis-from-id-result-model.model';
import { GetAllAnalysesForUserResult } from '../../../application/results/get-all-analyses-for-user-result.result';

export class GetAllAnalysesForUserResponseDTO {
  constructor(
    public readonly success: boolean,
    public readonly message?: string,
    public readonly analyses?: GitHubAnalysisGeneralDataDTO[],
  ) {}

  public static fromResult(result: GetAllAnalysesForUserResult): GetAllAnalysesForUserResponseDTO {
    return new GetAllAnalysesForUserResponseDTO(result.success, result.message, result.analyses);
  }
}
