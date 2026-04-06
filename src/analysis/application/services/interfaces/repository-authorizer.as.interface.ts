import { PATPassword } from '../../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../../domain/value-objects/repo-url.vo';

export interface IRepositoryAuthorizer {
  authorize(url: RepoURL, password?: PATPassword): Promise<PersonalAccessToken>;
}