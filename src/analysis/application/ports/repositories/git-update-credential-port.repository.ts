import { UpdateGitCredentialPatRequest } from '../../DTOs/models/requests/update-git-credential-pat-request.model';
import { UpdateGitCredentialPatResponse } from '../../DTOs/models/responses/update-git-credential-pat-response.model';

export interface IGitCredentialUpdatePort {
  updatePAT(request: UpdateGitCredentialPatRequest): Promise<UpdateGitCredentialPatResponse>;
}
