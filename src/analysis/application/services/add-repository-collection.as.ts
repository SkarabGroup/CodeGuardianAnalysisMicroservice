import { Inject, Injectable } from '@nestjs/common';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { AddRepositoryCollectionCommand } from '../commands/add-repository-collection-command.command';
import { AddRepositoryCollectionResult } from '../results/add-repository-collection-result.result';
import { AddRepositoryCollectionUseCase } from '../use-case/add-repository-collection-use-case.uc';

import type { ICollectionExistenceChecker } from './interfaces/collection-checker.as.interface';
import type { ICollectionAdderPort } from '../ports/repositories/add-collection-port.port';

import { COLLECTION_DUPLICATE_CHECKER } from './github-collection-checker.as';
import { COLLECTION_ADDER_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { AddRepositoryCollectionRequest } from '../DTOs/models/requests/add-repository-collection-request.model';

@Injectable()
export class AddRepositoryCollectionService implements AddRepositoryCollectionUseCase {
  constructor(
    @Inject(COLLECTION_DUPLICATE_CHECKER)
    private readonly duplicateChecker: ICollectionExistenceChecker,
    @Inject(COLLECTION_ADDER_PORT)
    private readonly collectionAdder: ICollectionAdderPort,
  ) {}

  async execute(command: AddRepositoryCollectionCommand): Promise<AddRepositoryCollectionResult> {
    try {
      const user: UserId = UserId.create(command.user);
      const url: RepoURL = RepoURL.create(command.url);
      const collectionName: string = command.name;
      const description: string = command.description ? command.description : '';

      // Check if already exists
      // True if there's already a collection for provided url, false otherwise
      if (await this.duplicateChecker.check(user, url)) {
        return AddRepositoryCollectionResult.failure('Collection for repository already exists');
      }

      console.log("The duplicateChecker didn't find any other collection for the provided URL");
      console.log('Starting Collection Creation');

      await this.collectionAdder.addCollection(
        new AddRepositoryCollectionRequest(user, url, collectionName, description),
      );
      console.log('Collection successfully added');

      return AddRepositoryCollectionResult.success();
    } catch (error) {
      return AddRepositoryCollectionResult.failure(
        error instanceof Error ? error.message : 'Impossibile to create new collection',
      );
    }
  }
}

export const ADD_COLLECTION_SERVICE = Symbol('AddRepositoryUseCase');
