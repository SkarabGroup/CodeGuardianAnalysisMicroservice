import { CloneRepoRequestModel } from '../../DTOs/models/requests/clone-repo-request-model.model';
import { CloneRepoResponseModel } from '../../DTOs/models/responses/clone-repo-response-model.model';

export interface IGitClonePort {
  clone(model: CloneRepoRequestModel): Promise<CloneRepoResponseModel>;
}
