import { AnalysisStatus } from '../../../../domain/enums/analysis-status.enum';
import { CodeAnalysisReportDTO } from './code-agent-response-model.model';
import { DocsAnalysisReportDTO } from './docs-agent-response-model.model';
import { SecAnalysisReportDTO } from './security-agent-response-model.model';

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
export class GitHubAnalysisDetailedResult {
  generalData: GitHubAnalysisGeneralDataDTO;
  docsReport: DocsAnalysisReportDTO | null;
  codeReport: CodeAnalysisReportDTO | null;
  securityReport: SecAnalysisReportDTO | null;

  constructor(
    record: GitHubAnalysisGeneralDataDTO,
    docsReport: DocsAnalysisReportDTO | null = null,
    codeReport: CodeAnalysisReportDTO | null = null,
    securityReport: SecAnalysisReportDTO | null = null,
  ) {
    this.generalData = record;
    this.docsReport = docsReport;
    this.codeReport = codeReport;
    this.securityReport = securityReport;
  }
}
