import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DocumentationReportDocument = HydratedDocument<DocumentationReport>;

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum StatusMissing {
  NOT_FOUND = 'NOT_FOUND',
  POSSIBLY_RENAMED = 'POSSIBLY_RENAMED',
  WRONG_PATH = 'WRONG_PATH',
}

// ─── Sub-document Classes ─────────────────────────────────────────────────────

@Schema({ _id: false })
class APIViolation {
  @Prop({ required: true, trim: true })
  path: string = '';

  @Prop({ required: true, trim: true })
  rule: string = '';

  @Prop({ required: true, enum: SeverityLevel })
  severity!: SeverityLevel;

  @Prop({ required: true, trim: true })
  description: string = '';
}

@Schema({ _id: false })
class DocsDiscrepancy {
  @Prop({ required: true, trim: true })
  path: string = '';

  @Prop({ required: true, trim: true })
  discrepancyCategory: string = '';

  @Prop({ required: true, enum: SeverityLevel })
  severity!: SeverityLevel;

  @Prop({ required: true, trim: true })
  docsClaim: string = '';

  @Prop({ required: true, trim: true })
  actualFinding: string = '';
}

@Schema({ _id: false })
class MissingFile {
  @Prop({ required: true, trim: true })
  referencedPath: string = '';

  @Prop({ required: true, trim: true })
  referencedIn: string = '';

  @Prop({ required: true, trim: true })
  description: string = '';

  @Prop({ required: true, enum: StatusMissing })
  status!: StatusMissing;
}
@Schema({ _id: false })
class ReadmeDependency {
  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ type: String, default: null })
  versionClaimed: string | null = null;
}

@Schema({ _id: false })
class ConfigDependency {
  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ type: String, default: null })
  versionPinned: string | null = null;

  @Prop({ required: true, trim: true })
  path: string = '';
}

@Schema({ _id: false })
class MissingInConfigDependency {
  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ required: true, trim: true })
  path: string = '';

  @Prop({ required: true, enum: SeverityLevel })
  severity!: SeverityLevel;
}

@Schema({ _id: false })
class UndocumentedDependency {
  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ required: true, trim: true })
  path: string = '';
}

@Schema({ _id: false })
class VersionMismatchDependency {
  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ required: true, trim: true })
  readmeVersion: string = '';

  @Prop({ required: true, trim: true })
  configVersion: string = '';

  @Prop({ required: true, trim: true })
  path: string = '';
}

@Schema({ _id: false })
class DependencyAudit {
  @Prop({ type: [SchemaFactory.createForClass(ReadmeDependency)], default: [] })
  readmeDefined!: ReadmeDependency[];

  @Prop({ type: [SchemaFactory.createForClass(ConfigDependency)], default: [] })
  configDefined!: ConfigDependency[];

  @Prop({ type: [SchemaFactory.createForClass(MissingInConfigDependency)], default: [] })
  missingInConfig!: MissingInConfigDependency[];

  @Prop({ type: [SchemaFactory.createForClass(UndocumentedDependency)], default: [] })
  undocumentedInReadme!: UndocumentedDependency[];

  @Prop({ type: [SchemaFactory.createForClass(VersionMismatchDependency)], default: [] })
  versionMismatches!: VersionMismatchDependency[];
}

// ─── Main Root Schema ─────────────────────────────────────────────────────────

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Schema({
  collection: 'documentation_reports',
  timestamps: true,
})
export class DocumentationReport {
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

  @Prop({ type: [SchemaFactory.createForClass(APIViolation)], default: [] })
  apiViolations!: APIViolation[];

  @Prop({ type: [SchemaFactory.createForClass(DocsDiscrepancy)], default: [] })
  docsDiscrepancies!: DocsDiscrepancy[];

  @Prop({ type: [SchemaFactory.createForClass(MissingFile)], default: [] })
  missingFiles!: MissingFile[];

  @Prop({ type: SchemaFactory.createForClass(DependencyAudit), default: null })
  dependencyAudit!: DependencyAudit | null;
}

export const DocumentationReportSchema = SchemaFactory.createForClass(DocumentationReport);

// Aggiunta manuale degli indici extra per le performance sulle severity
DocumentationReportSchema.index({ 'apiViolations.severity': 1 });
DocumentationReportSchema.index({ 'docsDiscrepancies.severity': 1 });
