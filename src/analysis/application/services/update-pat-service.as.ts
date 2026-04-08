import { Inject, Injectable } from '@nestjs/common';
import type { IGitCredentialUpdatePort } from '../ports/repositories/git-update-credential-port.repository';
import { UpdatePatCommand } from '../commands/update-pat-command.command';
import { UpdatePatUseCase } from '../use-case/update-pat-use-case.uc';
import { UpdatePatResult } from '../results/update-pat-result.result';
import { UpdateGitCredentialPatRequest } from '../DTOs/models/requests/update-git-credential-pat-request.model';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { GIT_CREDENTIAL_UPDATE_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';

@Injectable()
export class UpdatePatService implements UpdatePatUseCase {
  constructor(
    @Inject(GIT_CREDENTIAL_UPDATE_PORT) private readonly credentialPort: IGitCredentialUpdatePort,
  ) {}
  async execute(command: UpdatePatCommand): Promise<UpdatePatResult> {
    const request = new UpdateGitCredentialPatRequest(
      RepoURL.create(command.repositoryUrl),
      PATPassword.create(command.patPassword),
      PersonalAccessToken.create(command.newPat),
    );

    try {
      const response = await this.credentialPort.updatePAT(request);
      if (response.isSuccess) {
        return UpdatePatResult.success();
      }
      return UpdatePatResult.failure(
        response.errorMessage || 'Unknown error occurred while updating Git credentials',
      );
    } catch (error) {
      return UpdatePatResult.failure(
        `Failed to update Git credentials: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export const UPDATE_PAT = Symbol('UpdatePatUseCase');
