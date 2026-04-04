import { DeleteGitCredentialRequest } from '../../DTOs/models/requests/delete-git-credential-request.model';
import { DeleteGitCredentialResponse } from '../../DTOs/models/responses/delete-git-credential-response.model';

export interface IGitCredentialDeletePort {
  deletePAT(request: DeleteGitCredentialRequest): Promise<DeleteGitCredentialResponse>;
}
