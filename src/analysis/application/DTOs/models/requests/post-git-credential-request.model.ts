import { PATPassword } from '../../../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../../../domain/value-objects/repo-url.vo';

export class PostGitCredentialRequest {
  constructor(
    public readonly repoUrl: RepoURL,
    public readonly password: PATPassword,
    public readonly pat: PersonalAccessToken,
  ) {}
}
