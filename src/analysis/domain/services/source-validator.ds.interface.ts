import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../value-objects/personal-access-token.vo';
import { RepoURL } from '../value-objects/repo-url.vo';

export interface ISourceValidator {
  check(
    url: RepoURL,
    pat: PersonalAccessToken | null,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): Promise<CommitHash>;
}
