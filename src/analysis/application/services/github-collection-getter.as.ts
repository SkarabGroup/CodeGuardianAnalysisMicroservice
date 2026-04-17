import { Inject, Injectable } from '@nestjs/common';
import { GetRepositoryCollectionUseCase } from '../use-case/get-repository-collection-use-case.uc';
import { GetRepositoryCollectionCommand } from '../commands/get-repository-collection-command.command';
import { GetRepositoryCollectionResult } from '../results/get-repository-collection-result.result';
import type { IGetRepositoryCollectionPort } from '../ports/repositories/get-repository-collection-port.port';
import { COLLECTION_GETTER_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GetRepositoryCollectionRequest } from '../DTOs/models/requests/get-repository-collection-request.model';

@Injectable()
export class GitHubCollectionGetter implements GetRepositoryCollectionUseCase {
  constructor(
    @Inject(COLLECTION_GETTER_PORT)
    private readonly port: IGetRepositoryCollectionPort,
  ) {}

  async execute(command: GetRepositoryCollectionCommand): Promise<GetRepositoryCollectionResult> {
    try {
      const response = await this.port.getRepositoryCollection(
        new GetRepositoryCollectionRequest(command.user, command.url),
      );

      if (!response.success) {
        return GetRepositoryCollectionResult.failure(
          response.message || 'Impossible to get the collection',
        );
      }

      return GetRepositoryCollectionResult.success({
        url: response.url,
        name: response.name,
        description: response.description,
        analyses: response.analyses,
      });
    } catch (error) {
      return GetRepositoryCollectionResult.failure(
        error instanceof Error ? error.message : 'Impossible to get the collection',
      );
    }
  }
}
export const GET_COLLECTION_SERVICE = Symbol('GetRepositoryCollectionUseCase');
