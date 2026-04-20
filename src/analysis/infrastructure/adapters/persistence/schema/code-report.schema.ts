import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CodeReportDocument = HydratedDocument<CodeReport>;

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum CodeVerdict {
  CRITICAL = 'CRITICAL',
  POOR = 'POOR',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT',
}

// ─── Sub-document Classes ─────────────────────────────────────────────────────

@Schema({ _id: false })
class IssueLocation {
  @Prop({ required: true, min: 1 })
  lineStart!: number;

  @Prop({ required: true, min: 1 })
  lineEnd!: number;

  @Prop({ required: true, min: 1 })
  column!: number;
}

@Schema({ _id: false })
class KeyIssueReasoning {
  @Prop({ required: true, trim: true })
  file: string = '';

  @Prop({ type: SchemaFactory.createForClass(IssueLocation), required: true })
  location!: IssueLocation;

  @Prop({ required: true, trim: true })
  rule: string = '';

  @Prop({ required: true, enum: SeverityLevel })
  severity!: SeverityLevel;

  @Prop({ required: true, trim: true })
  originalDescription: string = '';

  @Prop({ required: true, trim: true })
  aiReasoning: string = '';

  @Prop({ required: false, trim: true })
  suggestedResolution?: string = '';
}

@Schema({ _id: false })
class StaticAnalysisEvaluation {
  @Prop({ required: true, min: 0 })
  totalIssuesAnalyzed: number = 0;

  @Prop({ type: [SchemaFactory.createForClass(KeyIssueReasoning)], default: [] })
  keyIssuesReasoning!: KeyIssueReasoning[];
}

@Schema({ _id: false })
class CodeAgentMetadata {
  @Prop({ required: false, trim: true })
  language?: string = '';

  @Prop({ required: true, trim: true })
  status: string = '';
}

@Schema({ _id: false })
class CriticalFileReasoning {
  @Prop({ required: true, trim: true })
  file: string = '';

  @Prop({ required: true, min: 0, max: 1 })
  lineCoveragePct!: number;

  @Prop({ type: [Number], default: [] })
  missingLines: number[] = [];

  @Prop({ required: true, min: 0 })
  missingBranches: number = 0;

  @Prop({ required: true, trim: true })
  aiReasoning: string = '';
}

@Schema({ _id: false })
class CoverageEvaluation {
  @Prop({ required: true, trim: true })
  overallHealth: string = '';

  @Prop({ type: [SchemaFactory.createForClass(CriticalFileReasoning)], default: [] })
  criticalFilesReasoning!: CriticalFileReasoning[];
}

@Schema({ _id: false })
class AIInterpretation {
  @Prop({ required: true, enum: CodeVerdict })
  verdict!: CodeVerdict;

  @Prop({ required: true, trim: true })
  executiveSummary: string = '';

  @Prop({ type: SchemaFactory.createForClass(StaticAnalysisEvaluation), required: true })
  staticAnalysisEvaluation!: StaticAnalysisEvaluation;

  @Prop({ type: SchemaFactory.createForClass(CoverageEvaluation), required: true })
  coverageEvaluation!: CoverageEvaluation;
}

// ─── Main Root Schema ─────────────────────────────────────────────────────────

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Schema({
  timestamps: true,
  collection: 'code_reports',
})
export class CodeReport {
  @Prop({
    required: true,
    unique: true,
    match: UUID_V7_REGEX,
  })
  reportId: string = '';

  @Prop({
    required: true,
    unique: true,
    index: true,
    match: UUID_V7_REGEX,
  })
  analysisId: string = '';

  @Prop({ type: SchemaFactory.createForClass(CodeAgentMetadata), required: true })
  metadata!: CodeAgentMetadata;

  @Prop({ type: SchemaFactory.createForClass(AIInterpretation), required: true })
  interpretation!: AIInterpretation;
}

export const CodeReportSchema = SchemaFactory.createForClass(CodeReport);

CodeReportSchema.index({ 'interpretation.verdict': 1 });
CodeReportSchema.index({ 'metadata.language': 1 });
