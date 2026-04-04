import { PATPassword } from '../../../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../../../domain/value-objects/repo-url.vo';

export class UpdateGitCredentialPatRequest {
  constructor(
    public readonly repoUrl: RepoURL,
    public readonly patPassword: PATPassword,
    public readonly newPat: PersonalAccessToken,
  ) {}
}
