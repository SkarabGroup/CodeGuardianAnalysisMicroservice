import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GitCredentialDocument = HydratedDocument<GitCredential>;

@Schema({
  timestamps: true,
  collection: 'git_credentials',
})
export class GitCredential {
  @Prop({ required: true, unique: true, index: true })
  repoUrl: string = '';

  @Prop({ required: true, match: /^[a-f0-9]{64}$/i })
  password: string = '';

  @Prop({ required: true })
  patToken: string = '';
}

export const GitCredentialSchema = SchemaFactory.createForClass(GitCredential);
