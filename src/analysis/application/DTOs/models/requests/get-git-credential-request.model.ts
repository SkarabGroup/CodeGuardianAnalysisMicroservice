import { PATPassword } from '../../../../domain/value-objects/pat-password.vo';
import { RepoURL } from '../../../../domain/value-objects/repo-url.vo';

export class GetGitCredentialRequest {
  constructor(
    public readonly repoUrl: RepoURL,
    public readonly password: PATPassword,
  ) {}
}
