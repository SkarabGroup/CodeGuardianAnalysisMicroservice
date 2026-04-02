import { Inject, Injectable } from '@nestjs/common';
import { IValidatorServiceInterface } from '../interfaces/validator-service.ai';
import { ValidationModel } from '../DTOs/models/responses/validation-model.model';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { GetGitCredentialRequest } from '../DTOs/models/requests/get-git-credential-request.model';
import { CheckAvailabilityRequestModel } from '../DTOs/models/requests/check-availability-request-model.model';
import type { IPATPasswordVOGeneratorInterface } from '../../domain/interfaces/pat-password-vo-generator.di';
import type { IPersonalAccessTokenVoGeneratorInterface } from '../../domain/interfaces/personal-access-token-vo-generator.di';
import {
  PAT_PASSWORD_GENERATOR,
  PERSONAL_ACCESS_TOKEN_GENERATOR,
} from '../../domain/services/domain-objects-provider.ds';
import type { IGitCredentialReadPort } from '../ports/repositories/git-credential-read-port.repository';
import type { IGitHubAvailabilityPort } from '../ports/externals/github-availability-port.port';
import { GIT_CREDENTIAL_READ_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GITHUB_AVAILABILITY_PORT } from '../../infrastructure/adapters/externals/github-adapter.adapter';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';

@Injectable()
export class ValidatorService implements IValidatorServiceInterface {
  constructor(
    @Inject(PAT_PASSWORD_GENERATOR)
    private readonly patPasswordGenerator: IPATPasswordVOGeneratorInterface,
    @Inject(PERSONAL_ACCESS_TOKEN_GENERATOR)
    private readonly personalAccessTokenGenerator: IPersonalAccessTokenVoGeneratorInterface,
    @Inject(GIT_CREDENTIAL_READ_PORT)
    private readonly gitCredentialPort: IGitCredentialReadPort,
    @Inject(GITHUB_AVAILABILITY_PORT)
    private readonly gitHubAvailabilityPort: IGitHubAvailabilityPort,
  ) {}

  async validateAccess(analysis: GitHubAnalysis, patPassword: string): Promise<ValidationModel> {
    let patToken: PersonalAccessToken | null = null;

    if (patPassword.trim() !== '') {
      let patPasswordVO;

      try {
        patPasswordVO = this.patPasswordGenerator.createPATPasswordVO(patPassword);
      } catch {
        return new ValidationModel(false, null, 'Invalid PAT password format.');
      }

      const gitCredentialRequest = new GetGitCredentialRequest(
        analysis.getRepoURL().value,
        patPasswordVO.value,
      );

      const response = await this.gitCredentialPort.authorize(gitCredentialRequest);

      if (!response.isAuthorized) {
        return new ValidationModel(
          false,
          null,
          response.errorMessage || 'Unauthorized access to the repository.',
        );
      }

      patToken = this.personalAccessTokenGenerator.createPersonalAccessTokenVO(patPassword);
    }

    const availabilityRequest = new CheckAvailabilityRequestModel(
      analysis.getRepoURL().value,
      patToken?.value ?? null,
      analysis.getBranch()?.value ?? null,
      analysis.getCommit()?.value ?? null,
    );

    const availabilityResponse = await this.gitHubAvailabilityPort.check(availabilityRequest);

    if (!availabilityResponse.isAccessible) {
      return new ValidationModel(
        false,
        null,
        availabilityResponse.errorMessage || 'Repository is not available.',
      );
    }

    return new ValidationModel(true, patToken?.value ?? null, 'Access validated successfully.');
  }
}
