import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AnalysisStatus } from '../../../../domain/enums/analysis-status.enum';

export type GitHubAnalysisDocument = HydratedDocument<GitHubAnalysisRecord>;

@Schema({
  timestamps: true,
  collection: 'github_analyses',
  minimize: false,
})
export class GitHubAnalysisRecord {
  @Prop({ required: true, unique: true, index: true })
  analysisId: string = '';

  @Prop({ required: true })
  userId: string = '';

  @Prop({ required: true })
  repoURL: string = '';

  @Prop({ required: true })
  branch: string = '';

  @Prop({ required: true })
  commit: string = '';

  @Prop({ type: String, enum: AnalysisStatus })
  status!: AnalysisStatus;

  @Prop({ type: String, default: null })
  codeReportId: string | null = null;

  @Prop({ type: String, default: null })
  docsReportId: string | null = null;

  @Prop({ type: String, default: null })
  securityReportId: string | null = null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GitHubAnalysisSchema = SchemaFactory.createForClass(GitHubAnalysisRecord);
