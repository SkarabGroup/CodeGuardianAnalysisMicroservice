import { RepoURL } from '../../../../domain/value-objects/repo-url.vo';
import { UserId } from '../../../../domain/value-objects/user-id.vo';

export class DeleteRepositoryCollectionRequest {
  constructor(
    public readonly user: UserId,
    public readonly url: RepoURL,
  ) {}
}
