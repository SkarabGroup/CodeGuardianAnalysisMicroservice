import { AnalysisModel } from './analysis.model';

export class GitHubAnalysisModel extends AnalysisModel {
  constructor(
    id: string,
    userId: string,
    status: string,
    public readonly repoURL: string,
    public readonly branch: string,
    public readonly commit: string | null,
  ) {
    super(id, userId, status);
  }
}
