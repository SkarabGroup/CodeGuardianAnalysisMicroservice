import { AnalysisStatus } from '../../../../domain/enums/analysis-status.enum';
import { DocsAnalysisReportDTO } from './docs-agent-response-model.model';

/**
 * Rappresenta l'analisi completa arricchita con i dati reali del report
 * invece del solo riferimento (ID).
 */

export interface GitHubAnalysisGeneralDataDTO {
  analysisId: string;
  userId: string;
  repoURL: string;
  branch: string;
  commit: string;
  status: AnalysisStatus;
  createdAt: Date;
  updatedAt: Date;
}
export class GitHubAnalysisDetailedDTO {
  generalData: GitHubAnalysisGeneralDataDTO;
  docsReport: DocsAnalysisReportDTO | null;

  constructor(
    record: GitHubAnalysisGeneralDataDTO,
    docsReport: DocsAnalysisReportDTO | null = null,
  ) {
    this.generalData = record;
    this.docsReport = docsReport;
  }
}
