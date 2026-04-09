import { ReportId } from '../value-objects/report-id.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { DependencyFinding } from '../value-objects/dependency-finding.vo';
import { OWASPFinding } from '../value-objects/owasp-finding.vo';
import { SecretFinding } from '../value-objects/secret-finding.vo';

export type SecurityReportProps = {
  reportId: ReportId;
  analysisId: AnalysisId;
  dependencyFindings: DependencyFinding[];
  owaspFindings: OWASPFinding[];
  secretFindings: SecretFinding[];
};

export class SecurityReport {
  private constructor(
    private readonly reportId: ReportId,
    private readonly analysisId: AnalysisId,
    private readonly dependencyFindings: DependencyFinding[],
    private readonly owaspFindings: OWASPFinding[],
    private readonly secretFindings: SecretFinding[],
  ) {}

  public static create(properties: SecurityReportProps): SecurityReport {
    return new SecurityReport(
      properties.reportId,
      properties.analysisId,
      properties.dependencyFindings ?? [],
      properties.owaspFindings ?? [],
      properties.secretFindings ?? [],
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

  public equals(other: SecurityReport): boolean {
    return other instanceof SecurityReport && this.reportId.equals(other.reportId);
  }
}
