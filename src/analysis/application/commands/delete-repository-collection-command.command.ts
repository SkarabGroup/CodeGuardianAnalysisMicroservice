import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteRepositoryCollectionCommand {
  @IsString()
  @IsNotEmpty()
  public readonly url: RepoURL;

  @IsString()
  @IsNotEmpty()
  public readonly user: UserId;

  constructor(data: { url: string; user: string }) {
    this.url = RepoURL.create(data.url);
    this.user = UserId.create(data.user);
  }
}
