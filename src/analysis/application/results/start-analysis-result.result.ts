export class StartAnalysisResult {
  private constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly user: string,
    public readonly id?: string,
    public readonly url?: string,
    public readonly branch?: string,
    public readonly commit?: string,
  ) {}

  public static success(
    user: string,
    id: string,
    url: string,
    branch: string,
    commit: string,
    message: string,
  ): StartAnalysisResult {
    return new StartAnalysisResult(true, message, user, id, url, branch, commit);
  }

  public static failure(user: string, message: string): StartAnalysisResult {
    return new StartAnalysisResult(false, message, user);
  }
}
