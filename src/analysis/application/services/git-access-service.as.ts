import { Inject, Injectable } from '@nestjs/common';

import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';

import { IRepositoryAuthorizer } from './interfaces/repository-authorizer.as.interface';

import { GetGitCredentialRequest } from '../DTOs/models/requests/get-git-credential-request.model';
import { GetGitCredentialResponse } from '../DTOs/models/responses/get-git-credential-response.model';

import type { IGitCredentialReadPort } from '../ports/repositories/git-credential-read-port.repository';
import { GIT_CREDENTIAL_READ_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';

@Injectable()
export class GitAccessService implements IRepositoryAuthorizer {
  constructor(
    @Inject(GIT_CREDENTIAL_READ_PORT)
    private readonly credentialPort: IGitCredentialReadPort,
  ) {}

  public async authorize(url: RepoURL, password: PATPassword): Promise<PersonalAccessToken> {
    const credentialRequest: GetGitCredentialRequest = new GetGitCredentialRequest(url, password);

    const credentialResponse: GetGitCredentialResponse =
      await this.credentialPort.authorize(credentialRequest);

    if (
      credentialResponse.errorMessage ||
      !credentialResponse.isAuthorized ||
      !credentialResponse.patToken
    ) {
      throw new Error(credentialResponse.errorMessage || 'Authorization not granted');
    }

    return PersonalAccessToken.create(credentialResponse.patToken);
  }
}

export const ACCESS_AUTHORIZER = Symbol('IRepositoryAuthorizer');
