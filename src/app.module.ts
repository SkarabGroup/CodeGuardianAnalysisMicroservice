import { Module } from '@nestjs/common';
import {
  DomainObjectsProvider,
  PAT_PASSWORD_GENERATOR,
  PERSONAL_ACCESS_TOKEN_GENERATOR,
} from './domain/services/domain-objects-provider.ds';
import { GIT_CREDENTIAL_READ_PORT } from './infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GITHUB_AVAILABILITY_PORT } from './infrastructure/adapters/externals/github-adapter.adapter';

@Module({
  imports: [],
  controllers: [],
  providers: [
    DomainObjectsProvider,
    {
      provide: PAT_PASSWORD_GENERATOR,
      useExisting: DomainObjectsProvider,
    },
    {
      provide: PERSONAL_ACCESS_TOKEN_GENERATOR,
      useExisting: DomainObjectsProvider,
    },
    {
      provide: GIT_CREDENTIAL_READ_PORT,
      useExisting: DomainObjectsProvider,
    },
    {
      provide: GITHUB_AVAILABILITY_PORT,
      useExisting: DomainObjectsProvider,
    },
  ],
})
export class AppModule {}
