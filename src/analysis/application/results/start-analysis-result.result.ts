export class StartAnalysisResult {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly analysisId?: string,
    public readonly error?: string,
  ) {}

  public static success(id: string): StartAnalysisResult {
    return new StartAnalysisResult(true, id);
  }

  public static failure(message: string): StartAnalysisResult {
    return new StartAnalysisResult(false, undefined, message);
  }
}
