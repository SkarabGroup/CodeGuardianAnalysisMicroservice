import { Inject, Injectable } from '@nestjs/common';
import { StartAnalysisUseCase } from '../use-case/start-analysis.uc';
import { StartAnalysisCommand } from '../commands/start-analysis-command.command';
import { StartAnalysisResult } from '../results/start-analysis-result.result';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { GetGitCredentialRequest } from '../DTOs/models/requests/get-git-credential-request.model';

import type { IAnalysisFactory } from '../../domain/services/analysis-factory.ds.interface';
import type { IGitCredentialReadPort } from '../ports/repositories/git-credential-read-port.repository';
import type { IGitHubAvailabilityPort } from '../ports/externals/github-availability-port.port';

import { GIT_CREDENTIAL_READ_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { ANALYSIS_PROVIDER } from '../../domain/services/analysis-provider.ds';
import { GITHUB_AVAILABILITY_PORT } from '../../infrastructure/adapters/externals/github-adapter.adapter';

import { CheckAvailabilityRequest } from '../DTOs/models/requests/check-availability-request-model.model';
import { CheckAvailabilityResponse } from '../DTOs/models/responses/check-availability-response-model.model';

@Injectable()
export class StartAnalysis implements StartAnalysisUseCase {
  public constructor(
    @Inject(ANALYSIS_PROVIDER) private readonly analysisProvider: IAnalysisFactory,
    @Inject(GIT_CREDENTIAL_READ_PORT) private readonly credentialPort: IGitCredentialReadPort,
    @Inject(GITHUB_AVAILABILITY_PORT) private readonly availabilityPort: IGitHubAvailabilityPort,
  ) {}

  public async execute(command: StartAnalysisCommand): Promise<StartAnalysisResult> {
    let analysis: GitHubAnalysis;

    try {
      analysis = this.analysisProvider.createGitHubAnalysisEntity(command);
    } catch (error) {
      return StartAnalysisResult.failure(
        error instanceof Error ? error.message : 'Invalid analysis data',
      );
    }

    let pat: PersonalAccessToken | null = null;

    if (command.patPassword) {
      try {
        const credentialRequest = new GetGitCredentialRequest(
          analysis.getRepoURL(),
          PATPassword.create(command.patPassword),
        );

        const credentialResponse = await this.credentialPort.authorize(credentialRequest);

        if (
          credentialResponse.errorMessage ||
          !credentialResponse.isAuthorized ||
          !credentialResponse.patToken
        ) {
          return StartAnalysisResult.failure('Authorization not granted');
        }

        pat = PersonalAccessToken.create(credentialResponse.patToken);
      } catch (error) {
        return StartAnalysisResult.failure(
          error instanceof Error ? error.message : 'Credential error',
        );
      }
    }

    let accessibilityResponse: CheckAvailabilityResponse;

    try {
      const accessibilityRequest = new CheckAvailabilityRequest(
        analysis.getRepoURL(),
        pat,
        analysis.getBranch(),
        analysis.getCommit(),
      );

      accessibilityResponse = await this.availabilityPort.check(accessibilityRequest);

      if (!accessibilityResponse.isAccessible) {
        return StartAnalysisResult.failure(
          accessibilityResponse.errorMessage || 'GitHub repository not accessible',
        );
      }
    } catch (error) {
      return StartAnalysisResult.failure(
        error instanceof Error ? error.message : 'Error during the analysis',
      );
    }

    const resultData = accessibilityResponse.commit
      ? accessibilityResponse.commit
      : analysis.getAnalysisId().value;

    return StartAnalysisResult.success(resultData);
  }
}

export const START_ANALYSIS_SERVICE = Symbol('StartAnalysisUC');
