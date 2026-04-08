import { Inject, Injectable } from '@nestjs/common';
import { StartAnalysisUseCase } from '../use-case/start-analysis.uc';
import { StartAnalysisCommand } from '../commands/start-analysis-command.command';
import { StartAnalysisResult } from '../results/start-analysis-result.result';

import { PASSWORD_PROVIDER } from '../../domain/services/pat-password-provider.ds';
import { ACCESS_AUTHORIZER } from './git-authorizer-service.as';
import { CLONE_VALIDATOR } from './git-validator-service.as';
import { REPOSITORY_CLONER } from './git-cloner-service.as';
import { ANALYSIS_ORCHESTRATOR } from './analysis-orchestrator-service.as';

import { UserId } from '../../domain/value-objects/user-id.vo';
import { AnalysisId } from '../../domain/value-objects/analysis-id.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { BranchName } from '../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../domain/value-objects/commit-hash.vo';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';

import type { IPasswordProvider } from '../../domain/services/interfaces/password-provider.ds.interface';
import type { IRepositoryAuthorizer } from './interfaces/repository-authorizer.as.interface';
import type { IRepositoryValidator } from './interfaces/repository-validator.as.interface';
import type { IRepositoryCloner } from './interfaces/repository-cloner.as.interface';
import type { IAnalysisOrchestrator } from './interfaces/analysis-orchestrator.as.interface';

import { v7 as uuid } from 'uuid';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';

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
    @Inject(ANALYSIS_ORCHESTRATOR)
    private readonly orchestrationService: IAnalysisOrchestrator,
  ) {}

  public async execute(command: StartAnalysisCommand): Promise<StartAnalysisResult> {
    const user = UserId.create(command.user);
    const analysisId: AnalysisId = AnalysisId.create(uuid());
    const repoURL: RepoURL = RepoURL.create(command.url);
    const password: PATPassword | undefined = command.password
      ? this.passwordProviderService.generate(command.password)
      : undefined;

    const pat: PersonalAccessToken = await this.authorizationService.authorize(repoURL, password);
    const providedBranch = command.branch ? BranchName.create(command.branch) : null;
    const providedCommit = command.commit ? CommitHash.create(command.commit) : null;

    const { branch, commit } = await this.validatorService.check(
      repoURL,
      pat,
      providedBranch,
      providedCommit,
    );

    const localFolderPath = await this.clonerService.clone(
      repoURL,
      analysisId,
      pat,
      branch,
      commit,
    );

    const analysis: GitHubAnalysis = GitHubAnalysis.create({
      id: analysisId,
      user: user,
      url: repoURL,
      branch: branch,
      commit: commit,
    });

    this.orchestrationService.analyze(
      analysis,
      localFolderPath,
      command.code,
      command.docs,
      command.security,
    );

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
