import { GetGitCredentialRequest } from '../../DTOs/models/requests/get-git-credential-request.model';
import { GetGitCredentialResponse } from '../../DTOs/models/responses/get-git-credential-response.model';

export interface IGitCredentialReadPort {
  authorize(model: GetGitCredentialRequest): Promise<GetGitCredentialResponse>;
}
