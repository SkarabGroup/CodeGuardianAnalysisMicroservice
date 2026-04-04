import { PostGitCredentialRequest } from '../../DTOs/models/requests/post-git-credential-request.model';
import { PostGitCredentialResponse } from '../../DTOs/models/responses/post-git-credential-result.model';

export interface IGitCredentialWritePort {
  save(request: PostGitCredentialRequest): Promise<PostGitCredentialResponse>;
}
