import { ReportId } from '../value-objects/report-id.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { DependencyFinding } from '../value-objects/dependency-finding.vo';
import { OWASPFinding } from '../value-objects/owasp-finding.vo';
import { SecretFinding } from '../value-objects/secret-finding.vo';
import { ToolError } from '../value-objects/tool-error.vo';

export type SecurityReportProps = {
  reportId: ReportId;
  analysisId: AnalysisId;
  dependencyFindings: DependencyFinding[];
  owaspFindings: OWASPFinding[];
  secretFindings: SecretFinding[];
  toolErrors: ToolError[];
};

export class SecurityReport {
  private constructor(
    private readonly reportId: ReportId,
    private readonly analysisId: AnalysisId,
    private readonly dependencyFindings: DependencyFinding[],
    private readonly owaspFindings: OWASPFinding[],
    private readonly secretFindings: SecretFinding[],
    private readonly toolErrors: ToolError[],
  ) {}

  public static create(properties: SecurityReportProps): SecurityReport {
    return new SecurityReport(
      properties.reportId,
      properties.analysisId,
      properties.dependencyFindings ?? [],
      properties.owaspFindings ?? [],
      properties.secretFindings ?? [],
      properties.toolErrors ?? [],
    );
  }

  public getReportId(): ReportId {
    return this.reportId;
  }

  public getAnalysisId(): AnalysisId {
    return this.analysisId;
  }

  public getDependencyFindings(): DependencyFinding[] {
    return [...this.dependencyFindings];
  }

  public getOwaspFindings(): OWASPFinding[] {
    return [...this.owaspFindings];
  }

  public getSecretFindings(): SecretFinding[] {
    return [...this.secretFindings];
  }

  public getToolErrors(): ToolError[] {
    return [...this.toolErrors];
  }

  public equals(other: SecurityReport): boolean {
    return other instanceof SecurityReport && this.reportId.equals(other.reportId);
  }
}
