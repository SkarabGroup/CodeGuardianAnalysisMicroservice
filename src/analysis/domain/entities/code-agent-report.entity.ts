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
    private readonly _createdAt: Date,
  ) {}

  public static create(
    id: ReportId,
    analysisId: AnalysisId,
    metadata: CodeAgentMetadata,
    interpretation: AIInterpretation,
  ): CodeAgentReport {
    return new CodeAgentReport(id, analysisId, metadata, interpretation, new Date());
  }

  public static restore(
    id: ReportId,
    analysisId: AnalysisId,
    metadata: CodeAgentMetadata,
    interpretation: AIInterpretation,
    createdAt: Date,
  ): CodeAgentReport {
    return new CodeAgentReport(id, analysisId, metadata, interpretation, createdAt);
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
  public get createdAt(): Date {
    return this._createdAt;
  }
}
