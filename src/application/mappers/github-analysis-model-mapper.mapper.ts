import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { GitHubAnalysisModel } from '../DTOs/models/github-analysis-model.model';
import { AnalysisType } from '../../domain/enums/analysis-type.enum';

export class GitHubAnalysisMapper {
  public static toModel(entity: GitHubAnalysis): GitHubAnalysisModel {
    return new GitHubAnalysisModel(
      entity.getAnalysisId().value,
      entity.getUserId().value,
      AnalysisType.GITHUB,
      entity.getStatus(),
      entity.getRepoURL().value,
      entity.getBranch().value,
      entity.getCommit() ? entity.getCommit()!.value : null,
    );
  }
}
