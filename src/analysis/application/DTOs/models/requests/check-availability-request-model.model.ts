import { BranchName } from '../../../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../../../domain/value-objects/repo-url.vo';

export class CheckAvailabilityRequest {
  constructor(
    public readonly repoUrl: RepoURL,
    public readonly patToken: PersonalAccessToken | null,
    public readonly branch: BranchName | null,
    public readonly commit: CommitHash | null,
  ) {}
}
