import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Services & Ports
import {
  StartAnalysisService,
  START_ANALYSIS_SERVICE,
} from './application/services/start-analysis.as';
import {
  GET_ANALYSIS_SERVICE,
  GET_ALL_ANALYSES_FOR_USER_SERVICE,
  GetAnalysisService,
} from './application/services/get-analysis-service.as';
import {
  ANALYSIS_ORCHESTRATOR,
  AnalysisOrchestratorService,
} from './application/services/analysis-orchestrator-service.as';
import {
  ACCESS_AUTHORIZER,
  GitAuthorizerService,
} from './application/services/git-authorizer-service.as';
import {
  CLONE_VALIDATOR,
  GitValidatorService,
} from './application/services/git-validator-service.as';
import { GitClonerService, REPOSITORY_CLONER } from './application/services/git-cloner-service.as';

// Adapters
import {
  MongoDBAdapter,
  GIT_CREDENTIAL_SAVE_PORT,
  GIT_CREDENTIAL_UPDATE_PORT,
  GIT_CREDENTIAL_DELETE_PORT,
  GIT_CREDENTIAL_READ_PORT,
  GITHUB_ANALYSIS_SAVE_PORT,
  DOCS_REPORT_SAVE_PORT,
  ADD_REPORTS_TO_ANALYSIS_PORT,
  GET_DETAILED_ANALYSIS_PORT,
  GET_ALL_ANALYSES_FOR_USER_PORT,
  CODE_REPORT_SAVE_PORT,
  COLLECTION_DUPLICATE_PORT,
  COLLECTION_ADDER_PORT,
  COLLECTION_GETTER_PORT,
  COLLECTION_DELETER_PORT,
  ALL_COLLECTION_GETTER_PORT,
  SECURITY_REPORT_SAVE_PORT,
} from './infrastructure/adapters/persistence/mongo-adapter.adapter';
import {
  AVAILABILITY_PORT,
  CLONING_PORT,
  GitHubAdapter,
} from './infrastructure/adapters/externals/github-adapter.adapter';
import { S3Adapter } from './infrastructure/adapters/externals/s3-adapter.adapter.aws';
import {
  CODE_AGENT,
  LocalCodeAnalysisAdapter,
} from './infrastructure/adapters/externals/local-code-agent.adapter';
import { ECSCodeAnalysisAdapter } from './infrastructure/adapters/externals/strands-code-adapter.adapter.aws';
import {
  DOCS_AGENT,
  DocumentationAnalysisAdapter,
} from './infrastructure/adapters/externals/docs-agent.adapter';
import {
  LocalSecurityAnalysisAdapter,
  SECURITY_AGENT,
} from './infrastructure/adapters/externals/security-agent.adapter';

// Schemas
import {
  GitCredential,
  GitCredentialSchema,
} from './infrastructure/adapters/persistence/schema/github-repo-credentials.schema';
import {
  GitHubAnalysisRecord,
  GitHubAnalysisSchema,
} from './infrastructure/adapters/persistence/schema/github-analysis.schema';
import {
  GitHubCollection,
  GitHubCollectionSchema,
} from './infrastructure/adapters/persistence/schema/github-collection.schema';
import {
  DocumentationReport,
  DocumentationReportSchema,
} from './infrastructure/adapters/persistence/schema/docs-report.schema';
import {
  CodeReport,
  CodeReportSchema,
} from './infrastructure/adapters/persistence/schema/code-report.schema';
import {
  SecurityReport,
  SecurityReportSchema,
} from './infrastructure/adapters/persistence/schema/security-report.schema';

// Configuration & Domain
import { ConfigurationModule } from './infrastructure/configuration/configuration.module';
import { ConfigurationService } from './infrastructure/configuration/configuration.service';
import {
  ReportEntitiesProvider,
  DOCS_REPORT_PROVIDER,
  CODE_REPORT_PROVIDER,
  SECURITY_REPORT_PROVIDER,
} from './domain/services/report-entities-provider.ds';
import { PASSWORD_PROVIDER, PATPasswordProvider } from './domain/services/pat-password-provider.ds';

// Controllers & Others
import { AnalysisController } from './presentation/controllers/analysis-controller.controller';
import { PatController } from './presentation/controllers/pat-controller.controller';
import { RepositoriesController } from './presentation/controllers/repositories-controller.controller';
import { ADD_NEW_PAT, NewPatService } from './application/services/new-pat-service.as';
import { DELETE_PAT, DeletePatService } from './application/services/delete-pat-service.as';
import { UPDATE_PAT, UpdatePatService } from './application/services/update-pat-service.as';
import {
  ADD_COLLECTION_SERVICE,
  AddRepositoryCollectionService,
} from './application/services/add-repository-collection.as';
import {
  COLLECTION_DUPLICATE_CHECKER,
  GitHubCollectionChecker,
} from './application/services/github-collection-checker.as';
import {
  GET_ALL_COLLECTIONS_SERVICE,
  GET_COLLECTION_SERVICE,
  GitHubCollectionGetter,
} from './application/services/github-collection-getter.as';
import {
  DELETE_COLLECTION_SERVICE,
  GitHubCollectionDeleter,
} from './application/services/github-collection-deleter.as';
import { JwtStrategy } from './presentation/controllers/helper/jwt-guard.helper';
import { ECSDocumentationAnalysisAdapter } from './infrastructure/adapters/externals/strands-docs-adapter.adapter.aws';
import { ECSSecurityAnalysisAdapter } from './infrastructure/adapters/externals/strands-security-adapter.adapter.aws';

@Module({
  imports: [
    // 1. Carichiamo ConfigurationModule PER PRIMO per rendere disponibile ConfigurationService alle factory
    ConfigurationModule,

    // 2. Moduli DB
    MongooseModule.forFeature(
      [
        { name: GitCredential.name, schema: GitCredentialSchema },
        { name: GitHubAnalysisRecord.name, schema: GitHubAnalysisSchema },
        { name: GitHubCollection.name, schema: GitHubCollectionSchema },
        { name: DocumentationReport.name, schema: DocumentationReportSchema },
        { name: CodeReport.name, schema: CodeReportSchema },
        { name: SecurityReport.name, schema: SecurityReportSchema },
      ],
      'DatabaseConnection',
    ),

    // 3. Auth Moduli con factory async
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AnalysisController, PatController, RepositoriesController],
  providers: [
    JwtStrategy,
    {
      provide: START_ANALYSIS_SERVICE,
      useClass: StartAnalysisService,
    },
    {
      provide: ANALYSIS_ORCHESTRATOR,
      useClass: AnalysisOrchestratorService,
    },
    {
      provide: ADD_NEW_PAT,
      useClass: NewPatService,
    },
    {
      provide: DELETE_PAT,
      useClass: DeletePatService,
    },
    {
      provide: UPDATE_PAT,
      useClass: UpdatePatService,
    },
    {
      provide: PASSWORD_PROVIDER,
      useClass: PATPasswordProvider,
    },
    {
      provide: ACCESS_AUTHORIZER,
      useClass: GitAuthorizerService,
    },
    {
      provide: CLONE_VALIDATOR,
      useClass: GitValidatorService,
    },
    {
      provide: REPOSITORY_CLONER,
      useClass: GitClonerService,
    },
    // Persistence Ports
    { provide: GIT_CREDENTIAL_SAVE_PORT, useClass: MongoDBAdapter },
    { provide: GIT_CREDENTIAL_DELETE_PORT, useClass: MongoDBAdapter },
    { provide: GIT_CREDENTIAL_UPDATE_PORT, useClass: MongoDBAdapter },
    { provide: GIT_CREDENTIAL_READ_PORT, useClass: MongoDBAdapter },
    { provide: GITHUB_ANALYSIS_SAVE_PORT, useClass: MongoDBAdapter },
    { provide: DOCS_REPORT_SAVE_PORT, useClass: MongoDBAdapter },
    { provide: CODE_REPORT_SAVE_PORT, useClass: MongoDBAdapter },
    { provide: SECURITY_REPORT_SAVE_PORT, useClass: MongoDBAdapter },
    { provide: ADD_REPORTS_TO_ANALYSIS_PORT, useClass: MongoDBAdapter },
    { provide: GET_DETAILED_ANALYSIS_PORT, useClass: MongoDBAdapter },
    { provide: GET_ALL_ANALYSES_FOR_USER_PORT, useClass: MongoDBAdapter },
    { provide: ALL_COLLECTION_GETTER_PORT, useClass: MongoDBAdapter },
    { provide: COLLECTION_DUPLICATE_PORT, useClass: MongoDBAdapter },
    { provide: COLLECTION_ADDER_PORT, useClass: MongoDBAdapter },
    { provide: COLLECTION_GETTER_PORT, useClass: MongoDBAdapter },
    { provide: COLLECTION_DELETER_PORT, useClass: MongoDBAdapter },

    // External Adapters con Logica di Ambiente
    { provide: AVAILABILITY_PORT, useClass: GitHubAdapter },
    {
      provide: CLONING_PORT,
      useFactory: (configService: ConfigurationService) => {
        if (configService.isProduction) {
          return new S3Adapter(configService);
        }
        return new GitHubAdapter();
      },
      inject: [ConfigurationService],
    },
    {
      provide: CODE_AGENT,
      useFactory: (configService: ConfigurationService) => {
        if (configService.isProduction) {
          return new ECSCodeAnalysisAdapter(configService);
        }
        return new LocalCodeAnalysisAdapter();
      },
      inject: [ConfigurationService],
    },
    {
      provide: DOCS_AGENT,
      useFactory: (configService: ConfigurationService) => {
        if (configService.isProduction) {
          return new ECSDocumentationAnalysisAdapter(configService);
        }
        return new DocumentationAnalysisAdapter();
      },
      inject: [ConfigurationService],
    },
    {
      provide: SECURITY_AGENT,
      useFactory: (configService: ConfigurationService) => {
        if (configService.isProduction) {
          return new ECSSecurityAnalysisAdapter(configService);
        } else return new LocalSecurityAnalysisAdapter();
      },
      inject: [ConfigurationService],
    },

    // Domain Services
    { provide: DOCS_REPORT_PROVIDER, useClass: ReportEntitiesProvider },
    { provide: CODE_REPORT_PROVIDER, useClass: ReportEntitiesProvider },
    { provide: SECURITY_REPORT_PROVIDER, useClass: ReportEntitiesProvider },

    // Application Services
    { provide: GET_ANALYSIS_SERVICE, useClass: GetAnalysisService },
    { provide: GET_ALL_ANALYSES_FOR_USER_SERVICE, useClass: GetAnalysisService },
    { provide: ADD_COLLECTION_SERVICE, useClass: AddRepositoryCollectionService },
    { provide: COLLECTION_DUPLICATE_CHECKER, useClass: GitHubCollectionChecker },
    { provide: GET_COLLECTION_SERVICE, useClass: GitHubCollectionGetter },
    { provide: GET_ALL_COLLECTIONS_SERVICE, useClass: GitHubCollectionGetter },
    { provide: DELETE_COLLECTION_SERVICE, useClass: GitHubCollectionDeleter },
  ],
  exports: [START_ANALYSIS_SERVICE],
})
export class AnalysisModule {}
