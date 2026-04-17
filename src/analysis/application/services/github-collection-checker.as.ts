import { Inject, Injectable } from '@nestjs/common';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { CheckCollectionDuplicateRequest } from '../DTOs/models/requests/check-collection-duplicate-request.model';
import type { ICollectionExistenceChecker } from './interfaces/collection-checker.as.interface';

import { COLLECTION_DUPLICATE_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import type { ICollectionDuplicateCheckerPort } from '../ports/repositories/collection-duplicate-checker-port.port';
import { CheckCollectionDuplicateResponse } from '../DTOs/models/responses/check-collection-duplicate-response.model';

@Injectable()
export class GitHubCollectionChecker implements ICollectionExistenceChecker {
  constructor(
    @Inject(COLLECTION_DUPLICATE_PORT)
    private readonly duplicateCheckerPort: ICollectionDuplicateCheckerPort,
  ) {}

  async check(user: UserId, url: RepoURL): Promise<boolean> {
    const response: CheckCollectionDuplicateResponse =
      await this.duplicateCheckerPort.checkDuplicate(
        new CheckCollectionDuplicateRequest(user, url),
      );
    return response.duplicate;
  }
}

export const COLLECTION_DUPLICATE_CHECKER = Symbol('ICollectionExistenceChecker');
