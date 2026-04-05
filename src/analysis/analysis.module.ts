import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  StartAnalysisService,
  START_ANALYSIS_SERVICE,
} from './application/services/start-analysis.as';

import { AnalysisProvider, ANALYSIS_PROVIDER } from './domain/services/analysis-provider.ds';

import {
  MongoDBAdapter,
  GIT_CREDENTIAL_READ_PORT,
  GIT_CREDENTIAL_WRITE_PORT,
} from './infrastructure/adapters/persistence/mongo-adapter.adapter';

import {
  GitCredential,
  GitCredentialSchema,
} from './infrastructure/adapters/persistence/schema/github-repo-credentials.schema';
import { AnalysisController } from './presentation/controllers/analysis-controller.controller';
import { ACCESS_AUTHORIZER, GitAccessService } from './application/services/git-access-service.as';
import {
  CLONE_VALIDATOR,
  GitCloneValidatorService,
} from './application/services/git-clone-validator-service.as';
import { GitClonerService, REPOSITORY_CLONER } from './application/services/git-cloner-service.as';
import {
  AVAILABILITY_PORT,
  CLONING_PORT,
  GitHubAdapter,
} from './infrastructure/adapters/externals/github-adapter.adapter';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: GitCredential.name,
          schema: GitCredentialSchema,
        },
      ],
      'DatabaseConnection',
    ),
  ],
  providers: [
    // Application Service (Use Cases implementations)
    {
      provide: START_ANALYSIS_SERVICE,
      useClass: StartAnalysisService,
    },

    // Application Service (Use Cases Helpers)
    {
      provide: ANALYSIS_PROVIDER,
      useClass: AnalysisProvider,
    },
    {
      provide: ACCESS_AUTHORIZER,
      useClass: GitAccessService,
    },
    {
      provide: CLONE_VALIDATOR,
      useClass: GitCloneValidatorService,
    },
    {
      provide: REPOSITORY_CLONER,
      useClass: GitClonerService,
    },
    {
      provide: GIT_CREDENTIAL_READ_PORT,
      useClass: MongoDBAdapter,
    },
    {
      provide: GIT_CREDENTIAL_WRITE_PORT,
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
  ],
  controllers: [AnalysisController],
  exports: [START_ANALYSIS_SERVICE],
})
export class AnalysisModule {}
