import { GitHubAnalysisDetailedResult } from '../DTOs/models/responses/get-github-analysis-from-id-result-model.model';
export class GetAnalysisResult {
  private constructor(
    public readonly success: boolean,
    public readonly message?: string,
    // Campi flat (solo stringhe o primitivi)
    public readonly analysisId?: string,
    public readonly userId?: string,
    public readonly repoURL?: string,
    public readonly branch?: string,
    public readonly commit?: string,
    public readonly status?: string,
    public readonly createdAt?: string,
    public readonly updatedAt?: string,
    /**
     * Il report completo convertito in stringa JSON per
     * mantenere la struttura piatta del Result.
     */
    public readonly docsReportJson?: string,
  ) {}

  public static success(data: GitHubAnalysisDetailedResult, message?: string): GetAnalysisResult {
    return new GetAnalysisResult(
      true,
      message,
      data.generalData.analysisId,
      data.generalData.userId,
      data.generalData.repoURL,
      data.generalData.branch,
      data.generalData.commit,
      data.generalData.status.toString(),
      data.generalData.createdAt.toISOString(),
      data.generalData.updatedAt.toISOString(),
      data.docsReport ? JSON.stringify(data.docsReport) : undefined,
    );
  }

  public static failure(message: string): GetAnalysisResult {
    return new GetAnalysisResult(false, message);
  }
}
