import { GitHubAnalysisDetailedResult } from '../DTOs/models/responses/get-github-analysis-from-id-result-model.model';
import { DocsAnalysisReportDTO } from '../DTOs/models/responses/docs-agent-response-model.model';
import { CodeAnalysisReportDTO } from '../DTOs/models/responses/code-agent-response-model.model';
import { SecAnalysisReportDTO } from '../DTOs/models/responses/security-agent-response-model.model';

export class GetAnalysisResult {
  private constructor(
    public readonly success: boolean,
    public readonly message?: string,
    public readonly analysisData?: {
      analysisId: string;
      userId: string;
      repoURL: string;
      branch: string;
      commit: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    },
    public readonly docsReport?: DocsAnalysisReportDTO | null,
    public readonly codeReport?: CodeAnalysisReportDTO | null,
    public readonly secReport?: SecAnalysisReportDTO | null,
  ) {}

  public static success(data: GitHubAnalysisDetailedResult, message?: string): GetAnalysisResult {
    return new GetAnalysisResult(
      true,
      message,
      {
        analysisId: data.generalData.analysisId,
        userId: data.generalData.userId,
        repoURL: data.generalData.repoURL,
        branch: data.generalData.branch,
        commit: data.generalData.commit,
        status: data.generalData.status.toString(),
        createdAt: data.generalData.createdAt.toISOString(),
        updatedAt: data.generalData.updatedAt.toISOString(),
      },
      data.docsReport,
      data.codeReport,
      data.secReport,
    );
  }

  public static failure(message: string): GetAnalysisResult {
    return new GetAnalysisResult(false, message);
  }
}
