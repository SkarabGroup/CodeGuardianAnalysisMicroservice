import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AnalysisStatus } from '../../../../domain/enums/analysis-status.enum';

export type GitHubAnalysisDocument = HydratedDocument<GitHubAnalysisRecord>;

@Schema({
  timestamps: true,
  collection: 'github_analyses',
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
}

export const GitHubAnalysisSchema = SchemaFactory.createForClass(GitHubAnalysisRecord);
