import { RepoURL } from 'src/domain/value-objects/repo-url.vo';
import { GitAccessRequestModel } from '../DTOs/models/git-access-request-model.model';
import { PersonalAccessToken } from 'src/domain/value-objects/personal-access-token.vo';
import { BranchName } from 'src/domain/value-objects/branch-name.vo';
import { CommitHash } from 'src/domain/value-objects/commit-hash.vo';

export class GitAccessRequestModelMapper {
  public static toModel(
    repoURL: RepoURL,
    pat: PersonalAccessToken,
    branch: BranchName,
    commit: CommitHash,
  ): GitAccessRequestModel {
    return new GitAccessRequestModel(repoURL.value, branch.value, commit.value, pat.value);
  }
}
