import { PATPassword } from '../value-objects/pat-password.vo';
import { PersonalAccessToken } from '../value-objects/personal-access-token.vo';
import { RepoURL } from '../value-objects/repo-url.vo';

export interface IGitCredentialProvider {
  authorize(url: RepoURL, password: PATPassword): Promise<PersonalAccessToken>;
}
