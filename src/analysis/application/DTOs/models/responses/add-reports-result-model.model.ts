export class AddReportsToAnalysisResult {
  constructor(
    public readonly success: boolean,
    public readonly message?: string,
  ) {}

  public static success(): AddReportsToAnalysisResult {
    return new AddReportsToAnalysisResult(true);
  }

  public static failure(message: string): AddReportsToAnalysisResult {
    return new AddReportsToAnalysisResult(false, message);
  }
}
