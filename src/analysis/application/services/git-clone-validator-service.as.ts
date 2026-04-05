import { Inject, Injectable } from '@nestjs/common';
import { IRepositoryCloneValidator } from './interfaces/source-validator.ds.interface';
import { BranchName } from '../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';

import type { IGitHubAvailabilityPort } from '../ports/externals/github-availability-port.port';

import { AVAILABILITY_PORT } from '../../infrastructure/adapters/externals/github-adapter.adapter';

import { CheckAvailabilityRequest } from '../DTOs/models/requests/check-availability-request-model.model';

@Injectable()
export class GitCloneValidatorService implements IRepositoryCloneValidator {
  constructor(
    @Inject(AVAILABILITY_PORT)
    private readonly availabilityPort: IGitHubAvailabilityPort,
  ) {}

  async check(
    url: RepoURL,
    pat: PersonalAccessToken | null,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): Promise<CommitHash> {
    const request = new CheckAvailabilityRequest(url, pat, branch, commit);

    const response = await this.availabilityPort.check(request);

    if (!response.isAccessible) {
      throw new Error(response.errorMessage || 'Source repository is not accessible');
    }

    const finalSha = response.commit || (commit ? commit.value : null);

    if (!finalSha) {
      throw new Error('Could not resolve a valid commit hash for this analysis');
    }

    return CommitHash.create(finalSha);
  }
}

export const CLONE_VALIDATOR = Symbol('IRepositoryCloneValidator');
