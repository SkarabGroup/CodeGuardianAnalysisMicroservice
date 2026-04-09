export class SaveGitHubAnalysisRequest {
  constructor(
    public readonly analysisId: string,
    public readonly userId: string,
    public readonly repoURL: string,
    public readonly branch: string,
    public readonly commit: string,
    public readonly status: string,
  ) {}
}
