import { Inject, Injectable } from '@nestjs/common';
import { StartAnalysisUseCase } from '../use-case/start-analysis.uc';
import { StartAnalysisCommand } from '../commands/start-analysis-command.command';
import { StartAnalysisResult } from '../results/start-analysis-result.result';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';

import type { IAnalysisFactory } from '../../domain/services/analysis-factory.ds.interface';
import type { IRepositoryAuthorizer } from './interfaces/repository-authorizer.as.interface';
import type { IRepositoryCloneValidator } from './interfaces/source-validator.ds.interface';
import type { IRepositoryCloner } from './interfaces/repository-cloner.as.interface';

import { ANALYSIS_PROVIDER } from '../../domain/services/analysis-provider.ds';
import { ACCESS_AUTHORIZER } from './git-access-service.as';
import { CLONE_VALIDATOR } from './git-clone-validator-service.as';
import { REPOSITORY_CLONER } from './git-cloner-service.as';

import { createHash } from 'crypto';

@Injectable()
export class StartAnalysisService implements StartAnalysisUseCase {
  public constructor(
    @Inject(ANALYSIS_PROVIDER)
    private readonly analysisProvider: IAnalysisFactory,
    @Inject(ACCESS_AUTHORIZER)
    private readonly authorizer: IRepositoryAuthorizer,
    @Inject(CLONE_VALIDATOR)
    private readonly validator: IRepositoryCloneValidator,
    @Inject(REPOSITORY_CLONER)
    private readonly cloner: IRepositoryCloner,
  ) {}

  public async execute(command: StartAnalysisCommand): Promise<StartAnalysisResult> {
    const SHA256_REGEX = /^[a-f0-9]{64}$/i;
    try {
      const analysis = this.analysisProvider.createGitHubAnalysisEntity(command);

      const pat = command.patPassword
        ? await this.authorizer.authorize(
            analysis.getRepoURL(),
            PATPassword.create(SHA256_REGEX.test(command.patPassword) ? command.patPassword : createHash('sha256').update(command.patPassword).digest('hex')),
          )
        : null;

      const resolvedCommit = await this.validator.check(
        analysis.getRepoURL(),
        pat,
        analysis.getBranch(),
        analysis.getCommit(),
      );

      const path = await this.cloner.clone(
        analysis.getRepoURL(),
        analysis.getAnalysisId(),
        pat,
        analysis.getBranch(),
        resolvedCommit,
      );

      //emit analyzeRepository(path)

      return StartAnalysisResult.success(path);
    } catch (error) {
      return StartAnalysisResult.failure(
        error instanceof Error ? error.message : 'Analysis initiation failed',
      );
    }
  }
}

export const START_ANALYSIS_SERVICE = Symbol('StartAnalysisUC');
