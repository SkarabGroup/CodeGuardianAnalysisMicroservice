import { GitAccessRequestModel } from '../DTOs/models/git-access-request-model.model';
import { BranchName } from 'src/domain/value-objects/branch-name.vo';
import { CommitHash } from 'src/domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from 'src/domain/value-objects/personal-access-token.vo';
import { RepoURL } from 'src/domain/value-objects/repo-url.vo';

export class GitAccessRequestModelMapper {
  public static toModel(
    branch: BranchName,
    repoUrl: RepoURL,
    commitHash?: CommitHash,
    personalAccessToken?: PersonalAccessToken,
  ): GitAccessRequestModel {
    return new GitAccessRequestModel(
      repoUrl.value,
      branch.value,
      commitHash ? commitHash.value : null,
      personalAccessToken ? personalAccessToken.value : null,
    );
  }
}
