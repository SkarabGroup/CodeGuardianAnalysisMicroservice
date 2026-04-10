import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CodeReportDocument = HydratedDocument<CodeReportRecord>;

@Schema({
  timestamps: true,
  collection: 'code_reports',
})
export class CodeReportRecord {
  @Prop({ required: true, unique: true, index: true })
  reportId: string = '';

  @Prop({ required: true, index: true })
  analysisId: string = '';

  @Prop({ type: Array, default: [] })
  coverageFinding: object[] = [];

  @Prop({ type: Array, default: [] })
  staticAnalysisErrors: object[] = [];
}

export const CodeReportSchema = SchemaFactory.createForClass(CodeReportRecord);
