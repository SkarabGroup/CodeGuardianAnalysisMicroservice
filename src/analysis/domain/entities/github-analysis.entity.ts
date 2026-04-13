import { AnalysisId } from '../value-objects/analysis-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';
import { AnalysisStatus } from '../enums/analysis-status.enum';

// Properties
export type GitHubAnalysisProps = {
  id: AnalysisId;
  user: UserId;
  url: RepoURL;
  branch: BranchName;
  commit: CommitHash;
};

export class GitHubAnalysis {
  private constructor(
    private readonly analysisId: AnalysisId,
    private readonly userId: UserId,
    private readonly repoURL: RepoURL,
    private readonly branch: BranchName,
    private readonly commit: CommitHash,
    private status = AnalysisStatus.PENDING,
  ) {}

  public static create(properties: GitHubAnalysisProps): GitHubAnalysis {
    return new GitHubAnalysis(
      properties.id,
      properties.user,
      properties.url,
      properties.branch,
      properties.commit,
    );
  }

  public getRepoURL(): RepoURL {
    return this.repoURL;
  }

  public getBranch(): BranchName {
    return this.branch;
  }

  public getCommit(): CommitHash {
    return this.commit;
  }

  public equals(other: GitHubAnalysis): boolean {
    return other instanceof GitHubAnalysis && this.analysisId.equals(other.analysisId);
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
