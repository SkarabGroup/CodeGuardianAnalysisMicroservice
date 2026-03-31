import { GitRequestModel } from '../../DTOs/models/git-access-request-model.model';
import { GitRequestResult } from '../../DTOs/results/git-request-result.result';

export interface IGitValidatorPort {
  validateRequest(request: GitRequestModel): Promise<GitRequestResult>;
}
