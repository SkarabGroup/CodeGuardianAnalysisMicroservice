import { AnalysisId } from "../../../../domain/value-objects/analysis-id.vo";
import { DependencyFinding } from "../../../../domain/value-objects/dependency-finding.vo";
import { OWASPFinding } from "../../../../domain/value-objects/owasp-finding.vo";
import { ReportId } from "../../../../domain/value-objects/report-id.vo";
import { SecretFinding } from "../../../../domain/value-objects/secret-finding.vo";
import { ToolError } from "../../../../domain/value-objects/tool-error.vo";

export class SaveSecurityReportRequest {
  constructor(
    public readonly reportId: ReportId,
    public readonly analysisId: AnalysisId,
    public readonly dependencyFindings: DependencyFinding[],
    public readonly owaspFindings: OWASPFinding[],
    public readonly secretFindings: SecretFinding[],
    public readonly toolErrors: ToolError[],
  ) {}
}
