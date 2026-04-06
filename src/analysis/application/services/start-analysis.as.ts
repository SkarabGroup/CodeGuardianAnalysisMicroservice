import { Inject, Injectable } from '@nestjs/common';
import { StartAnalysisUseCase } from '../use-case/start-analysis.uc';
import { StartAnalysisCommand } from '../commands/start-analysis-command.command';
import { StartAnalysisResult } from '../results/start-analysis-result.result';
import type { IRepositoryAuthorizer } from './interfaces/repository-authorizer.as.interface';

import { ACCESS_AUTHORIZER } from './github-authorizer-service.as';

import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';

@Injectable()
export class StartAnalysisService implements StartAnalysisUseCase {
  public constructor(
    @Inject(ACCESS_AUTHORIZER)
    private readonly authorizationService: IRepositoryAuthorizer
  ) {}

  public async execute(command: StartAnalysisCommand): Promise<StartAnalysisResult> {
    const repoURL : RepoURL = RepoURL.create(command.repoURL);

    const pat = await this.authorizationService.authorize(
      repoURL, 
      command.patPassword ? PATPassword.create(command.patPassword) : undefined
    );
    /*
    try {
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
    */
  }
}

export const START_ANALYSIS_SERVICE = Symbol('StartAnalysisUC');
