export class AddReportsToAnalysisRequest {
  constructor(
    public readonly analysisId: string,
    public readonly codeReportId: string | null,
    public readonly documentationReportId: string | null,
    public readonly securityReportId: string | null,
  ) {}
}
