export class SaveSecurityReportResponse {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): SaveSecurityReportResponse {
    return new SaveSecurityReportResponse(true);
  }

  public static failure(error: string): SaveSecurityReportResponse {
    return new SaveSecurityReportResponse(false, error);
  }
}
