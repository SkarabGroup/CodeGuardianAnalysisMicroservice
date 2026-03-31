import { GitAccessRequestResult } from 'src/application/DTOs/results/git-access-request-result.result';
import { GitAccessRequestModel } from '../../DTOs/models/git-access-request-model.model';
export interface IGitValidatorPort {
  validateRequest(request: GitAccessRequestModel): Promise<GitAccessRequestResult>;
}
