import { ReportId } from '../../../../domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../domain/value-objects/analysis-id.vo';
import { CodeAgentMetadata } from '../../../../domain/value-objects/code-agent-metadata.vo';
import { AIInterpretation } from '../../../../domain/value-objects/ai-interpretation.vo';

export class SaveCodeReportRequest {
  constructor(
    public readonly reportId: ReportId,
    public readonly analysisId: AnalysisId,
    public readonly codeAgentMetadata: CodeAgentMetadata,
    public readonly aiInterpretation: AIInterpretation,
  ) {}
}
