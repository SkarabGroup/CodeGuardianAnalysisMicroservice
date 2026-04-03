import { CloneRepoRequest } from '../../DTOs/models/requests/clone-repo-request-model.model';
import { CloneRepoResponse } from '../../DTOs/models/responses/clone-repo-response-model.model';

export interface IGitClonePort {
  clone(model: CloneRepoRequest): Promise<CloneRepoResponse>;
}
