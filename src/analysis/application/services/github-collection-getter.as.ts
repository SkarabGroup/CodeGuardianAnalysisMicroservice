import { Inject, Injectable } from '@nestjs/common';
import { GetRepositoryCollectionUseCase } from '../use-case/get-repository-collection-use-case.uc';
import { GetRepositoryCollectionCommand } from '../commands/get-repository-collection-command.command';
import { GetRepositoryCollectionResult } from '../results/get-repository-collection-result.result';
import type { IGetRepositoryCollectionPort } from '../ports/repositories/get-repository-collection-port.port';
import {
  ALL_COLLECTION_GETTER_PORT,
  COLLECTION_GETTER_PORT,
} from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GetRepositoryCollectionRequest } from '../DTOs/models/requests/get-repository-collection-request.model';
import { GetAllRepositoryCollectionsUseCase } from '../use-case/get-all-repository-collection-use-case.uc';
import type { IGetAllRepositoryCollectionsPort } from '../ports/repositories/get-all-repository-collections-port.port';
import { GetAllRepositoryCollectionsCommand } from '../commands/get-all-repository-collections-command.command';
import { GetAllRepositoryCollectionsResult } from '../results/getl-all-repository-collection-result.result';
import { GetAllRepositoryCollectionsRequest } from '../DTOs/models/requests/get-all-repository-collection-request.model';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';

@Injectable()
export class GitHubCollectionGetter
  implements GetRepositoryCollectionUseCase, GetAllRepositoryCollectionsUseCase
{
  constructor(
    @Inject(COLLECTION_GETTER_PORT)
    private readonly singleCollectionGetter: IGetRepositoryCollectionPort,
    @Inject(ALL_COLLECTION_GETTER_PORT)
    private readonly allCollectionGetter: IGetAllRepositoryCollectionsPort,
  ) {}

  async execute(command: GetRepositoryCollectionCommand): Promise<GetRepositoryCollectionResult> {
    try {
      const response = await this.singleCollectionGetter.getRepositoryCollection(
        new GetRepositoryCollectionRequest(
          UserId.create(command.user),
          RepoURL.create(command.url),
        ),
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

  async executeAll(
    command: GetAllRepositoryCollectionsCommand,
  ): Promise<GetAllRepositoryCollectionsResult> {
    try {
      const response = await this.allCollectionGetter.getAllCollections(
        new GetAllRepositoryCollectionsRequest(UserId.create(command.userId)),
      );

      if (!response.success) {
        return GetAllRepositoryCollectionsResult.failure(
          response.message || 'Collections not found',
        );
      }

      return GetAllRepositoryCollectionsResult.success(response.data);
    } catch (error) {
      return GetAllRepositoryCollectionsResult.failure(
        error instanceof Error ? error.message : 'Internal Error',
      );
    }
  }
}
export const GET_COLLECTION_SERVICE = Symbol('GetRepositoryCollectionUseCase');
export const GET_ALL_COLLECTIONS_SERVICE = Symbol('GetAllUserCollectionsUseCase');
