import { PostGitCredentialRequest } from '../../DTOs/models/requests/post-git-credential-request.model';
import { PostGitCredentialResponse } from '../../DTOs/models/responses/post-git-credential-result.model';

export interface IGitCredentialSavePort {
  save(request: PostGitCredentialRequest): Promise<PostGitCredentialResponse>;
}
