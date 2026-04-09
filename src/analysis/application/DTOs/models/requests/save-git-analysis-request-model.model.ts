import { AnalysisId } from '../../../../domain/value-objects/analysis-id.vo';
import { UserId } from '../../../../domain/value-objects/user-id.vo';
import { RepoURL } from '../../../../domain/value-objects/repo-url.vo';
import { BranchName } from '../../../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../domain/value-objects/commit-hash.vo';
import { AnalysisStatus } from '../../../../domain/enums/analysis-status.enum';

export class SaveGitHubAnalysisRequest {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly userId: UserId,
    public readonly repoURL: RepoURL,
    public readonly branch: BranchName,
    public readonly commit: CommitHash,
    public readonly status: AnalysisStatus,
  ) {}
}
