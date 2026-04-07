import { Inject } from '@nestjs/common';
import type { IGitCredentialDeletePort } from '../ports/repositories/git-delete-credential-port.repository';
import { DeletePatCommand } from '../commands/delete-pat-command.command';
import { DeletePatUseCase } from '../use-case/delete-pat-use-case.uc';
import { DeletePatResult } from '../results/delete-pat-result.result';
import { DeleteGitCredentialRequest } from '../DTOs/models/requests/delete-git-credential-request.model';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';
import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { GIT_CREDENTIAL_DELETE_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';

export class DeletePatService implements DeletePatUseCase {
  constructor(
    @Inject(GIT_CREDENTIAL_DELETE_PORT) private readonly credentialPort: IGitCredentialDeletePort,
  ) {}
  async execute(command: DeletePatCommand): Promise<DeletePatResult> {
    const request = new DeleteGitCredentialRequest(
      RepoURL.create(command.repositoryUrl),
      PATPassword.create(command.patPassword),
    );

    try {
      const response = await this.credentialPort.deletePAT(request);
      if (response.isSuccess) {
        return DeletePatResult.success();
      }
      return DeletePatResult.failure(
        response.errorMessage || 'Unknown error occurred while deleting Git credentials',
      );
    } catch (error) {
      return DeletePatResult.failure(
        `Failed to delete Git credentials: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
