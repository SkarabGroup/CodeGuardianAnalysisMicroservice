import { Analysis } from './analysis.entity';
import { UserId } from '../value-objects/user-id.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';

export class GitHubAnalysis extends Analysis {
  private readonly repoURL: RepoURL;
  private readonly branch: BranchName;
  private readonly commit: CommitHash | null;

  private constructor(
    userId: UserId,
    repoURL: RepoURL,
    branch: BranchName,
    commit: CommitHash | null,
  ) {
    super(userId);
    this.repoURL = repoURL;
    this.branch = branch;
    this.commit = commit;
  }

  public static create(
    userId: UserId,
    repoURL: RepoURL,
    branch: BranchName,
    commit?: CommitHash,
  ): GitHubAnalysis {
    return new GitHubAnalysis(userId, repoURL, branch, commit ?? null);
  }

  public getRepoURL(): RepoURL {
    return this.repoURL;
  }

  public getBranch(): BranchName {
    return this.branch;
  }

  public getCommit(): CommitHash | null {
    return this.commit;
  }

  public equals(other: GitHubAnalysis): boolean {
    return other instanceof GitHubAnalysis && super.equals(other);
  }
}
