import { AnalysisId } from '../value-objects/analysis-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';
import { AnalysisStatus } from '../enums/analysis-status.enum';

export class GitHubAnalysis {
  private constructor(
    private readonly analysisId: AnalysisId,
    private readonly userId: UserId,
    private readonly repoURL: RepoURL,
    private readonly branch: BranchName | null,
    private readonly commit: CommitHash | null,
    private status = AnalysisStatus.PENDING,
  ) {
    if (commit === null && branch === null) this.branch = BranchName.create('main');
  }

  public static create(
    analysisId: AnalysisId,
    userId: UserId,
    repoURL: RepoURL,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): GitHubAnalysis {
    return new GitHubAnalysis(analysisId, userId, repoURL, branch, commit);
  }

  public getRepoURL(): RepoURL {
    return this.repoURL;
  }

  public getBranch(): BranchName | null {
    return this.branch;
  }

  public getCommit(): CommitHash | null {
    return this.commit;
  }

  public equals(other: GitHubAnalysis): boolean {
    return other instanceof GitHubAnalysis && this.analysisId === other.analysisId;
  }

  public complete() {
    if (this.status === AnalysisStatus.IN_PROGRESS) {
      this.status = AnalysisStatus.COMPLETED;
    } else {
      throw new Error('Analysis can only be completed if it is in progress');
    }
  }

  public inProgress() {
    if (this.status === AnalysisStatus.PENDING) {
      this.status = AnalysisStatus.IN_PROGRESS;
    } else {
      throw new Error('Analysis can only be set to in progress if it is pending');
    }
  }

  public failed() {
    if (this.status === AnalysisStatus.IN_PROGRESS) {
      this.status = AnalysisStatus.FAILED;
    } else {
      throw new Error('Analysis can only be failed if it is in progress');
    }
  }

  public pending() {
    this.status = AnalysisStatus.PENDING;
  }

  public getAnalysisId(): AnalysisId {
    return this.analysisId;
  }

  public getUserId(): UserId {
    return this.userId;
  }

  public getStatus(): AnalysisStatus {
    return this.status;
  }
}
