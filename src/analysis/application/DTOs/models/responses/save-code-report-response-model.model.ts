export class SaveCodeReportResponse {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): SaveCodeReportResponse {
    return new SaveCodeReportResponse(true);
  }

  public static failure(error: string): SaveCodeReportResponse {
    return new SaveCodeReportResponse(false, error);
  }
}
