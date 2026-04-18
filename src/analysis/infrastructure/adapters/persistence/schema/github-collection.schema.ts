import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { GitHubAnalysisRecord } from './github-analysis.schema';

export type GitHubCollectionDocument = HydratedDocument<GitHubCollection>;

@Schema({
  timestamps: true,
  collection: 'github_collections',
})
export class GitHubCollection {
  @Prop({ required: true, unique: true, index: true })
  url: string = '';

  @Prop({ required: true })
  name: string = '';

  @Prop({ required: true })
  userId: string = '';

  @Prop({ required: false })
  description: string = '';

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GitHubAnalysisRecord' }] })
  analyses: GitHubAnalysisRecord[] = [];
}

export const GitHubCollectionSchema = SchemaFactory.createForClass(GitHubCollection);
GitHubCollectionSchema.index({ url: 1, userId: 1 }, { unique: true });
