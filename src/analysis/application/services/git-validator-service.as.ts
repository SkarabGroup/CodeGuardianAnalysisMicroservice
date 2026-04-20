import { Inject, Injectable } from '@nestjs/common';
import { BranchName } from '../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';

import type { IGitHubAvailabilityPort } from '../ports/externals/github-availability-port.port';
import type { IRepositoryValidator } from './interfaces/repository-validator.as.interface';

import { AVAILABILITY_PORT } from '../../infrastructure/adapters/externals/github-adapter.adapter';

import { CheckAvailabilityRequest } from '../DTOs/models/requests/check-availability-request-model.model';
import { CheckAvailabilityResponse } from '../DTOs/models/responses/check-availability-response-model.model';

interface RepositoryData {
  branch: string;
  commit: string;
}

interface ValidationStrategy {
  validate(): Promise<RepositoryData>;
}

class CommitValidationStrategy implements ValidationStrategy {
  constructor(
    private readonly port: IGitHubAvailabilityPort,
    private readonly url: RepoURL,
    private readonly commit: CommitHash,
    private readonly branch: BranchName | null,
    private readonly pat: PersonalAccessToken | null,
  ) {}

  async validate(): Promise<RepositoryData> {
    const request: CheckAvailabilityRequest = new CheckAvailabilityRequest(
      this.url,
      this.pat,
      this.branch,
      this.commit,
    );

    const response: CheckAvailabilityResponse = await this.port.check(request);
    if (!response.isAccessible || !response.commit || !response.branch) {
      throw new Error(response.errorMessage || `Commit ${this.commit.value} not accessible`);
    }
    return { branch: response.branch, commit: response.commit };
  }
}

class BranchValidationStrategy implements ValidationStrategy {
  constructor(
    private readonly port: IGitHubAvailabilityPort,
    private readonly url: RepoURL,
    private readonly branch: BranchName,
    private readonly pat: PersonalAccessToken | null,
  ) {}

  async validate(): Promise<RepositoryData> {
    const request = new CheckAvailabilityRequest(this.url, this.pat, this.branch, null);
    const response = await this.port.check(request);

    if (!response.isAccessible || !response.commit || !response.branch) {
      throw new Error(response.errorMessage || `Branch ${this.branch.value} not accessible`);
    }
    return { branch: response.branch, commit: response.commit };
  }
}

class DefaultValidationStrategy implements ValidationStrategy {
  constructor(
    private readonly port: IGitHubAvailabilityPort,
    private readonly url: RepoURL,
    private readonly pat: PersonalAccessToken | null,
  ) {}

  async validate(): Promise<RepositoryData> {
    const request = new CheckAvailabilityRequest(this.url, this.pat, null, null);
    const response = await this.port.check(request);

    if (!response.isAccessible || !response.branch) {
      throw new Error(response.errorMessage || 'Repository not accessible');
    }

    if (response.commit === 'PENDING') {
      const branchRequest = new CheckAvailabilityRequest(
        this.url,
        this.pat,
        BranchName.create(response.branch),
        null,
      );
      const branchRes = await this.port.check(branchRequest);

      if (!branchRes.isAccessible || !branchRes.commit) {
        throw new Error('Failed to resolve default branch commit');
      }
      return { branch: branchRes.branch!, commit: branchRes.commit };
    }

    return { branch: response.branch, commit: response.commit! };
  }
}

@Injectable()
export class GitValidatorService implements IRepositoryValidator {
  constructor(
    @Inject(AVAILABILITY_PORT)
    private readonly githubPort: IGitHubAvailabilityPort,
  ) {}

  public async check(
    url: RepoURL,
    pat: PersonalAccessToken | null,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): Promise<{ branch: BranchName; commit: CommitHash }> {
    const strategy = this.selectStrategy(url, pat, branch, commit);
    const repoInformation = await strategy.validate();

    return {
      branch: BranchName.create(repoInformation.branch),
      commit: CommitHash.create(repoInformation.commit),
    };
  }

  private selectStrategy(
    url: RepoURL,
    pat: PersonalAccessToken | null,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): ValidationStrategy {
    if (commit) {
      return new CommitValidationStrategy(this.githubPort, url, commit, branch, pat);
    }
    if (branch) {
      return new BranchValidationStrategy(this.githubPort, url, branch, pat);
    }
    return new DefaultValidationStrategy(this.githubPort, url, pat);
  }
}

export const CLONE_VALIDATOR = Symbol('IRepositoryCloneValidator');
