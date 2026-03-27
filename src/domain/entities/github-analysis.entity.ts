import { Analysis, AnalysisStatus } from './analysis.entity';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';

export class GitHubAnalysis extends Analysis {
  private readonly repoURL: RepoURL;
  private readonly branch: BranchName;
  private readonly commit: CommitHash | null;

  private constructor(
    id: AnalysisId,
    userId: UserId,
    status: AnalysisStatus,
    repoURL: RepoURL,
    branch: BranchName,
    commit?: CommitHash,
  ) {
    super(id, userId, status);
    this.validateRepoURL(repoURL);
    this.validateBranch(branch);
    this.validateCommit(commit);
    this.repoURL = repoURL;
    this.branch = branch;
    this.commit = commit ?? null;
  }

  public static create(
    id: AnalysisId,
    userId: UserId,
    repoURL: RepoURL,
    branch: BranchName,
    status: AnalysisStatus,
    commit?: CommitHash,
  ): GitHubAnalysis {
    return new GitHubAnalysis(id, userId, status, repoURL, branch, commit);
  }

  private validateRepoURL(repoURL: RepoURL): void {
    if (!(repoURL instanceof RepoURL)) {
      throw new Error('Invalid repoURL value');
    }
  }

  private validateBranch(branch: BranchName): void {
    if (!(branch instanceof BranchName)) {
      throw new Error('Invalid branch value');
    }
  }

  private validateCommit(commit?: CommitHash): void {
    if (commit !== undefined && !(commit instanceof CommitHash)) {
      throw new Error('Invalid commit value');
    }
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
