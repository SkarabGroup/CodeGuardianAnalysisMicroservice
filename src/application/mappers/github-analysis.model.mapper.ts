import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { GitHubAnalysisModel } from '../DTOs/models/github-analysis.model';

export class GitHubAnalysisMapper {
  static toModel(entity: GitHubAnalysis): GitHubAnalysisModel {
    return new GitHubAnalysisModel(
      entity.getAnalysisId().getValue(),
      entity.getUserId().getValue(),
      entity.getStatus(),
      entity.getRepoURL().getValue(),
      entity.getBranch().getValue(),
      entity.getCommit()?.getValue() ?? null,
    );
  }
}
