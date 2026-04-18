import { RepoURL } from '../../../domain/value-objects/repo-url.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';

export interface ICollectionExistenceChecker {
  check(user: UserId, url: RepoURL): Promise<boolean>;
}
