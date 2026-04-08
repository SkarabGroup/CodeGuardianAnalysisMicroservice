import { Inject, Injectable } from '@nestjs/common';
import { StartAnalysisUseCase } from '../use-case/start-analysis.uc';
import { StartAnalysisCommand } from '../commands/start-analysis-command.command';
import { StartAnalysisResult } from '../results/start-analysis-result.result';

import { ACCESS_AUTHORIZER } from './git-authorizer-service.as';
import { CLONE_VALIDATOR } from './git-validator-service.as';
import { REPOSITORY_CLONER } from './git-cloner-service.as';

import { UserId } from '../../domain/value-objects/user-id.vo';
import { AnalysisId } from '../../domain/value-objects/analysis-id.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { BranchName } from '../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';

import type { IPasswordProvider } from '../../domain/services/interfaces/password-provider.ds.interface';
import type { IRepositoryAuthorizer } from './interfaces/repository-authorizer.as.interface';
import type { IRepositoryValidator } from './interfaces/repository-validator.as.interface';
import type { IRepositoryCloner } from './interfaces/repository-cloner.as.interface';

import { PASSWORD_PROVIDER } from '../../domain/services/pat-password-provider.ds';

import { v7 as uuid } from 'uuid';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';

@Injectable()
export class StartAnalysisService implements StartAnalysisUseCase {
  public constructor(
    @Inject(PASSWORD_PROVIDER)
    private readonly passwordProviderService: IPasswordProvider,
    @Inject(ACCESS_AUTHORIZER)
    private readonly authorizationService: IRepositoryAuthorizer,
    @Inject(CLONE_VALIDATOR)
    private readonly validatorService: IRepositoryValidator,
    @Inject(REPOSITORY_CLONER)
    private readonly clonerService: IRepositoryCloner,
  ) {}

  public async execute(command: StartAnalysisCommand): Promise<StartAnalysisResult> {
    const user = UserId.create(command.user);
    const analysisId: AnalysisId = AnalysisId.create(uuid());
    const repoURL: RepoURL = RepoURL.create(command.url);
    const password: PATPassword | undefined = command.password
      ? this.passwordProviderService.generate(command.password)
      : undefined;

    console.log(
      `Istantiation of user, id, url and password completed. Password : ${password?.value}`,
    );

    const pat: PersonalAccessToken = await this.authorizationService.authorize(repoURL, password);
    console.log('PAT retrieved');
    const providedBranch = command.branch ? BranchName.create(command.branch) : null;
    console.log('All value object before commit created correctly');
    const providedCommit = command.commit ? CommitHash.create(command.commit) : null;
    console.log(`providedCommit created correctly: ${providedCommit?.value}`);

    const { branch, commit } = await this.validatorService.check(
      repoURL,
      pat,
      providedBranch,
      providedCommit,
    );
    console.log('Commit created from check()');
    const localFolderPath = await this.clonerService.clone(
      repoURL,
      analysisId,
      pat,
      branch,
      commit,
    );

    //emit(localFolderPath)
    return StartAnalysisResult.success(
      user.value,
      analysisId.value,
      repoURL.value,
      branch.value,
      commit.value,
      localFolderPath,
    );
  }
}

export const START_ANALYSIS_SERVICE = Symbol('StartAnalysisUC');
