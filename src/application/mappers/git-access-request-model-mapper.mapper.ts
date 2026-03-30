import { RepoURL } from 'src/domain/value-objects/repo-url.vo';
import { GitAccessRequestModel } from '../DTOs/models/git-access-request-model.model';
import { PersonalAccessToken } from 'src/domain/value-objects/personal-access-token.vo';

export class GitAccessRequestModelMapper {
  public static toModel(repoURL: RepoURL, pat: PersonalAccessToken): GitAccessRequestModel {
    return new GitAccessRequestModel(repoURL.value, pat.value);
  }
}
