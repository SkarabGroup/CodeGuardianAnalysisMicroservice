import { Inject, Injectable } from '@nestjs/common';
import { AnalysisId } from '../../domain/value-objects/analysis-id.vo';
import { BranchName } from '../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { IRepositoryCloner } from './interfaces/repository-cloner.as.interface';

import type { IGitClonePort } from '../ports/externals/github-clone-port.port';

import { CLONING_PORT } from '../../infrastructure/adapters/externals/github-adapter.adapter';

import { CloneRepoRequest } from '../DTOs/models/requests/clone-repo-request-model.model';

@Injectable()
export class GitClonerService implements IRepositoryCloner {
  constructor(
    @Inject(CLONING_PORT)
    private readonly cloningPort: IGitClonePort,
  ) {}

  async clone(
    repoUrl: RepoURL,
    analysisId: AnalysisId,
    patToken: PersonalAccessToken | null,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): Promise<string> {
    const response = await this.cloningPort.clone(
      new CloneRepoRequest(repoUrl, analysisId, patToken, branch, commit),
    );

    const path = response.localFolderPath;
    if (!response.cloned || !path) {
      throw new Error(response.errorMessage || 'Could not clone the repository');
    }

    return path;
  }
}

export const REPOSITORY_CLONER = Symbol('IRepositoryCloner');
