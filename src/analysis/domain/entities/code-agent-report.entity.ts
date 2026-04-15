import { AnalysisId } from '../value-objects/analysis-id.vo';
import { ReportId } from '../value-objects/report-id.vo';
import { CodeAgentMetadata } from '../value-objects/code-agent-metadata.vo';
import { AIInterpretation } from '../value-objects/ai-interpretation.vo';

export class CodeAgentReport {
  private constructor(
    private readonly _id: ReportId,
    private readonly _analysisId: AnalysisId,
    private readonly _metadata: CodeAgentMetadata,
    private readonly _interpretation: AIInterpretation,
  ) {}

  public static create(
    id: ReportId,
    analysisId: AnalysisId,
    metadata: CodeAgentMetadata,
    interpretation: AIInterpretation,
  ): CodeAgentReport {
    return new CodeAgentReport(id, analysisId, metadata, interpretation);
  }

  public get id(): ReportId {
    return this._id;
  }
  public get analysisId(): AnalysisId {
    return this._analysisId;
  }
  public get metadata(): CodeAgentMetadata {
    return this._metadata;
  }
  public get interpretation(): AIInterpretation {
    return this._interpretation;
  }

  public equals(other: CodeAgentReport): boolean {
    return other instanceof CodeAgentReport && this._id.equals(other.id);
  }
}
