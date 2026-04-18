import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SecurityReportDocument = HydratedDocument<SecurityReport>;

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ─── Sub-document Classes ─────────────────────────────────────────────────────

@Schema({ _id: false })
class DependencyFinding {
  @Prop({ required: true, trim: true })
  path: string = '';

  @Prop({ required: true, trim: true })
  packageName: string = '';

  @Prop({ required: true, trim: true })
  packageVersion: string = '';

  @Prop({ required: true, trim: true })
  vulnerabilityId: string = '';

  @Prop({ required: true, enum: SeverityLevel })
  severity!: SeverityLevel;

  @Prop({ required: true, trim: true })
  description: string = '';

  @Prop({ required: true, trim: true })
  remediation: string = '';
}

@Schema({ _id: false })
class ErrorFinding {
  @Prop({ required: true, min: 1 })
  line!: number;

  @Prop({ required: true, trim: true })
  description: string = '';

  @Prop({ required: true, enum: SeverityLevel })
  severity!: SeverityLevel;
}

@Schema({ _id: false })
class OWASPFinding {
  @Prop({ required: true, trim: true })
  path: string = '';

  @Prop({ type: SchemaFactory.createForClass(ErrorFinding), required: true })
  errorFinding!: ErrorFinding;

  @Prop({ required: true, trim: true })
  owaspCategory: string = '';

  @Prop({ required: true, trim: true })
  ruleId: string = '';

  @Prop({ required: true, trim: true })
  remediation: string = '';
}

@Schema({ _id: false })
class SecretFinding {
  @Prop({ required: true, trim: true })
  path: string = '';

  @Prop({ type: SchemaFactory.createForClass(ErrorFinding), required: true })
  errorFinding!: ErrorFinding;

  @Prop({ required: true, trim: true })
  secretCategory: string = '';

  @Prop({ required: true, trim: true })
  ruleId: string = '';

  @Prop({ required: true, trim: true })
  remediation: string = '';
}

@Schema({ _id: false })
class ToolError {
  @Prop({ required: true, trim: true })
  tool: string = '';

  @Prop({ required: true, trim: true })
  description: string = '';
}

// ─── Main Root Schema ─────────────────────────────────────────────────────────

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Schema({
  timestamps: true,
  collection: 'security_reports',
})
export class SecurityReport {
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

  @Prop({ type: [SchemaFactory.createForClass(DependencyFinding)], default: [] })
  dependencyFindings!: DependencyFinding[];

  @Prop({ type: [SchemaFactory.createForClass(OWASPFinding)], default: [] })
  owaspFindings!: OWASPFinding[];

  @Prop({ type: [SchemaFactory.createForClass(SecretFinding)], default: [] })
  secretFindings!: SecretFinding[];

  @Prop({ type: [SchemaFactory.createForClass(ToolError)], default: [] })
  toolErrors!: ToolError[];
}

export const SecurityReportSchema = SchemaFactory.createForClass(SecurityReport);

SecurityReportSchema.index({ 'dependencyFindings.severity': 1 });
SecurityReportSchema.index({ 'owaspFindings.errorFinding.severity': 1 });
SecurityReportSchema.index({ 'secretFindings.errorFinding.severity': 1 });
SecurityReportSchema.index({ 'owaspFindings.owaspCategory': 1 });
