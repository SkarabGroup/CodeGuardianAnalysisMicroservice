import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StartAnalysis, START_ANALYSIS_SERVICE } from './application/services/start-analysis.as';

import { AnalysisProvider, ANALYSIS_PROVIDER } from './domain/services/analysis-provider.ds';

import {
  MongoDBAdapter,
  GIT_CREDENTIAL_READ_PORT,
} from './infrastructure/adapters/persistence/mongo-adapter.adapter';

import {
  GitCredential,
  GitCredentialSchema,
} from './infrastructure/adapters/persistence/schema/github-repo-credentials.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: GitCredential.name, schema: GitCredentialSchema }])],
  providers: [
    {
      provide: ANALYSIS_PROVIDER,
      useClass: AnalysisProvider,
    },
    {
      provide: GIT_CREDENTIAL_READ_PORT,
      useClass: MongoDBAdapter,
    },
    {
      provide: START_ANALYSIS_SERVICE,
      useClass: StartAnalysis,
    },
  ],
  exports: [START_ANALYSIS_SERVICE],
})
export class AnalysisModule {}
