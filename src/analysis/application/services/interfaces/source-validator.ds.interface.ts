import { BranchName } from '../../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../../domain/value-objects/repo-url.vo';

export interface IRepositoryCloneValidator {
  check(
    url: RepoURL,
    pat: PersonalAccessToken | null,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): Promise<CommitHash>;
}
