export class SaveGitHubAnalysisResponse {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): SaveGitHubAnalysisResponse {
    return new SaveGitHubAnalysisResponse(true);
  }

  public static failure(error: string): SaveGitHubAnalysisResponse {
    return new SaveGitHubAnalysisResponse(false, error);
  }
}
