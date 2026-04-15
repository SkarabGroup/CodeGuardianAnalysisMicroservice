import { GetAnalysisResult } from '../../../application/results/get-analysis-result.result';

export class GetAnalysisResponseDTO {
  constructor(
    public readonly success: boolean,
    public readonly message?: string,
    public readonly analysisId?: string,
    public readonly userId?: string,
    public readonly repoURL?: string,
    public readonly branch?: string,
    public readonly commit?: string,
    public readonly status?: string,
    public readonly createdAt?: string,
    public readonly updatedAt?: string,
    public readonly docsReportJson?: string,
  ) {}

  public static fromResult(result: GetAnalysisResult): GetAnalysisResponseDTO {
    return new GetAnalysisResponseDTO(
      result.success,
      result.message,
      result.analysisId,
      result.userId,
      result.repoURL,
      result.branch,
      result.commit,
      result.status,
      result.createdAt,
      result.updatedAt,
      result.docsReportJson,
    );
  }
}
