import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import {
  StartAnalysisService,
  START_ANALYSIS_SERVICE,
} from './application/services/start-analysis.as';

import {
  MongoDBAdapter,
  GIT_CREDENTIAL_SAVE_PORT,
  GIT_CREDENTIAL_UPDATE_PORT,
  GIT_CREDENTIAL_DELETE_PORT,
  GIT_CREDENTIAL_READ_PORT,
  GITHUB_ANALYSIS_SAVE_PORT,
} from './infrastructure/adapters/persistence/mongo-adapter.adapter';

import {
  GitCredential,
  GitCredentialSchema,
} from './infrastructure/adapters/persistence/schema/github-repo-credentials.schema';
import {
  AnalysisController,
  JwtStrategy,
} from './presentation/controllers/analysis-controller.controller';
import {
  ACCESS_AUTHORIZER,
  GitAuthorizerService,
} from './application/services/git-authorizer-service.as';
import {
  CLONE_VALIDATOR,
  GitValidatorService,
} from './application/services/git-validator-service.as';
import { GitClonerService, REPOSITORY_CLONER } from './application/services/git-cloner-service.as';
import {
  AVAILABILITY_PORT,
  CLONING_PORT,
  GitHubAdapter,
} from './infrastructure/adapters/externals/github-adapter.adapter';
import { PatController } from './presentation/controllers/pat-controller.controller';
import { ADD_NEW_PAT, NewPatService } from './application/services/new-pat-service.as';
import { DELETE_PAT, DeletePatService } from './application/services/delete-pat-service.as';
import { UPDATE_PAT, UpdatePatService } from './application/services/update-pat-service.as';
import { PASSWORD_PROVIDER, PATPasswordProvider } from './domain/services/pat-password-provider.ds';
import {
  ANALYSIS_ORCHESTRATOR,
  AnalysisOrchestratorService,
} from './application/services/analysis-orchestrator-service.as';
import {
  GitHubAnalysisRecord,
  GitHubAnalysisSchema,
} from './infrastructure/adapters/persistence/schema/github-analysis.schema';
import {
  DOCS_AGENT,
  DocumentationAnalysisAdapter,
} from './infrastructure/adapters/externals/docs-agent.adapter';
import {
  CODE_AGENT,
  LocalCodeAnalysisAdapter,
} from './infrastructure/adapters/externals/local-code-agent.adapter';
import {
  DocumentationReport,
  DocumentationReportSchema,
} from './infrastructure/adapters/persistence/schema/docs-report.schema';
import { ConfigurationService } from './infrastructure/configuration/configuration.service';
import { ConfigurationModule } from './infrastructure/configuration/configuration.module';
import { AWSCodeAnalysisAdapter } from './infrastructure/adapters/externals/aws-code-agent.adapter';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: GitCredential.name,
          schema: GitCredentialSchema,
        },
        {
          name: GitHubAnalysisRecord.name,
          schema: GitHubAnalysisSchema,
        },
        {
          name: DocumentationReport.name,
          schema: DocumentationReportSchema,
        },
      ],
      'DatabaseConnection',
    ),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigurationService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigurationService],
    }),
    ConfigurationModule,
  ],
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
    {
      provide: GIT_CREDENTIAL_SAVE_PORT,
      useClass: MongoDBAdapter,
    },
    {
      provide: GIT_CREDENTIAL_DELETE_PORT,
      useClass: MongoDBAdapter,
    },
    {
      provide: GIT_CREDENTIAL_UPDATE_PORT,
      useClass: MongoDBAdapter,
    },
    {
      provide: GIT_CREDENTIAL_READ_PORT,
      useClass: MongoDBAdapter,
    },
    {
      provide: AVAILABILITY_PORT,
      useClass: GitHubAdapter,
    },
    {
      provide: CLONING_PORT,
      useClass: GitHubAdapter,
    },
    {
      provide: GITHUB_ANALYSIS_SAVE_PORT,
      useClass: MongoDBAdapter,
    },
    {
      provide: CODE_AGENT,
      useFactory: (configService: ConfigurationService) => {
        if (process.env.NODE_ENV === 'production') {
          console.log('Creato correttamente un LocalCode dal blocco if di production');
          return new AWSCodeAnalysisAdapter(configService);
        } else return new LocalCodeAnalysisAdapter();
      },
      inject: [ConfigurationService],
    },
    {
      provide: DOCS_AGENT,
      useClass: DocumentationAnalysisAdapter,
    },
  ],
  controllers: [AnalysisController, PatController],
  exports: [START_ANALYSIS_SERVICE],
})
export class AnalysisModule {}
