import { GitHubAnalysis } from 'src/domain/entities/github-analysis.entity';

import { GitHubAnalysisModel } from '../DTOs/models/github-analysis-model.model';

export class GitHubAnalysisMapper {
  public static toModel(entity: GitHubAnalysis): GitHubAnalysisModel {
    return new GitHubAnalysisModel(
      entity.getAnalysisId().value,
      entity.getUserId().value,
      entity.getType().toString(),
      entity.getStatus(),
      entity.getRepoURL().value,
      entity.getBranch().value,
      entity.getCommit() ? entity.getCommit()!.value : null,
    );
  }
}
