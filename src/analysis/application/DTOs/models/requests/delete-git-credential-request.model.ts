import { PATPassword } from '../../../../domain/value-objects/pat-password.vo';
import { RepoURL } from '../../../../domain/value-objects/repo-url.vo';

export class DeleteGitCredentialRequest {
  constructor(
    public readonly repoUrl: RepoURL,
    public readonly patPassword: PATPassword,
  ) {}
}
