import { Inject, Injectable } from '@nestjs/common';
import { DeleteRepositoryCollectionUseCase } from '../use-case/delete-repository-collection-use-case.uc';
import { DeleteRepositoryCollectionCommand } from '../commands/delete-repository-collection-command.command';
import { DeleteRepositoryCollectionResult } from '../results/delete-repository-collection-result.result';
import type { IDeleteRepositoryCollectionPort } from '../ports/repositories/delete-repository-collection-port.port';
import { DeleteRepositoryCollectionRequest } from '../DTOs/models/requests/delete-repository-collection-request.model';
import { COLLECTION_DELETER_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';

@Injectable()
export class GitHubCollectionDeleter implements DeleteRepositoryCollectionUseCase {
  constructor(
    @Inject(COLLECTION_DELETER_PORT)
    private readonly port: IDeleteRepositoryCollectionPort,
  ) {}

  async execute(
    command: DeleteRepositoryCollectionCommand,
  ): Promise<DeleteRepositoryCollectionResult> {
    try {
      console.log('[Application Service] Starting Port Method');
      const response = await this.port.deleteCollection(
        new DeleteRepositoryCollectionRequest(command.user, command.url),
      );
      console.log('[Application Service] Response obtained Correctly');
      if (!response.deleted) {
        console.log('[Application Service] Unsuccessful deletion');
        return DeleteRepositoryCollectionResult.failure(
          response.message || 'Impossible to delete the collection',
        );
      }
      return DeleteRepositoryCollectionResult.success();
    } catch (error) {
      return DeleteRepositoryCollectionResult.failure(
        error instanceof Error ? error.message : 'Impossible to delete the collection',
      );
    }
  }
}

export const DELETE_COLLECTION_SERVICE = Symbol('DeleteRepositoryCollectionUseCase');
