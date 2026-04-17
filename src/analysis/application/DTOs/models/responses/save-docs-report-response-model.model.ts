export class SaveDocsReportResponse {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): SaveDocsReportResponse {
    return new SaveDocsReportResponse(true);
  }

  public static failure(error: string): SaveDocsReportResponse {
    return new SaveDocsReportResponse(false, error);
  }
}
