import { AnalysisModel } from './analysis-model.model';

export class GithubAnalysisModel extends AnalysisModel {
  constructor(
    analysisId: string,
    userId: string,
    status: string,
    public readonly repositoryUrl: string,
    public readonly branchName: string,
    public readonly commitHash: string | null,
  ) {
    super(analysisId, userId, status);
  }
}
