import { CodeAnalysisReportDTO } from '../../../application/DTOs/models/responses/code-agent-response-model.model';
import { DocsAnalysisReportDTO } from '../../../application/DTOs/models/responses/docs-agent-response-model.model';
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
    public readonly docsReportJson?: DocsAnalysisReportDTO | null,
    public readonly codeReportJson?: CodeAnalysisReportDTO | null,
  ) {}

  public static fromResult(result: GetAnalysisResult): GetAnalysisResponseDTO {
    return new GetAnalysisResponseDTO(
      result.success,
      result.message,
      result.analysisData?.analysisId,
      result.analysisData?.userId,
      result.analysisData?.repoURL,
      result.analysisData?.branch,
      result.analysisData?.commit,
      result.analysisData?.status,
      result.analysisData?.createdAt,
      result.analysisData?.updatedAt,
      result.docsReport,
      result.codeReport,
    );
  }
}
