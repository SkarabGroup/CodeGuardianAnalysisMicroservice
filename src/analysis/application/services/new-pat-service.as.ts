import type { IGitCredentialSavePort } from '../ports/repositories/git-save-credential-port.repository';
import { NewPatCommand } from '../commands/new-pat-command.command';
import { NewPatUseCase } from '../use-case/new-pat-use-case.uc';
import { NewPatResult } from '../results/new-pat-result.result';
import { PostGitCredentialRequest } from '../DTOs/models/requests/post-git-credential-request.model';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { Inject, Injectable } from '@nestjs/common';
import { GIT_CREDENTIAL_SAVE_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';

import { createHash } from 'crypto';

@Injectable()
export class NewPatService implements NewPatUseCase {
  constructor(
    @Inject(GIT_CREDENTIAL_SAVE_PORT)
    private readonly gitSaveCredentialPort: IGitCredentialSavePort,
  ) {}

  async execute(command: NewPatCommand): Promise<NewPatResult> {
    const SHA256_REGEX = /^[a-f0-9]{64}$/i;

    const request = new PostGitCredentialRequest(
      RepoURL.create(command.repositoryUrl),
      PATPassword.create(
        SHA256_REGEX.test(command.patPassword)
          ? command.patPassword
          : createHash('sha256').update(command.patPassword).digest('hex'),
      ),
      PersonalAccessToken.create(command.personalAccessToken),
    );
    try {
      const response = await this.gitSaveCredentialPort.save(request);
      if (response.isSuccess) {
        return NewPatResult.success();
      }
      return NewPatResult.failure(
        response.errorMessage || 'Unknown error occurred while saving Git credentials',
      );
    } catch (error) {
      return NewPatResult.failure(
        `Failed to save Git credentials: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export const ADD_NEW_PAT = Symbol('NewPatUseCase');
