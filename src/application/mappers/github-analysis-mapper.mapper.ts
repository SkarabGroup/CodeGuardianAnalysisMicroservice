import { GitHubAnalysis } from 'src/domain/entities/github-analysis.entity';

import { GithubAnalysisModel } from '../DTOs/models/github-analysis-model.model';

export class GithubAnalysisMapper {
  public static toModel(entity: GitHubAnalysis): GithubAnalysisModel {
    return new GithubAnalysisModel(
      entity.getAnalysisId().value,
      entity.getUserId().value,
      entity.getStatus(),
      entity.getBranch().value,
      entity.getRepoURL().value,
      entity.getCommit() ? entity.getCommit()!.value : null,
    );
  }
}
