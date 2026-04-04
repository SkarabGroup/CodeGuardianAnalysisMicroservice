import { Inject, Injectable } from '@nestjs/common';

import { PATPassword } from '../value-objects/pat-password.vo';
import { PersonalAccessToken } from '../value-objects/personal-access-token.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { IGitCredentialProvider } from './git-credential-provider.ds.interface';
import { GetGitCredentialRequest } from '../../application/DTOs/models/requests/get-git-credential-request.model';

import type { IGitCredentialReadPort } from '../../application/ports/repositories/git-credential-read-port.repository';
import { GIT_CREDENTIAL_READ_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GetGitCredentialResponse } from '../../application/DTOs/models/responses/get-git-credential-response.model';

@Injectable()
export class GitCredentialManager implements IGitCredentialProvider {
  constructor(
    @Inject(GIT_CREDENTIAL_READ_PORT)
    private readonly credentialPort: IGitCredentialReadPort,
  ) {}

  public async authorize(url: RepoURL, password: PATPassword): Promise<PersonalAccessToken> {
    const credentialRequest: GetGitCredentialRequest = new GetGitCredentialRequest(url, password);

    const credentialResponse: GetGitCredentialResponse =
      await this.credentialPort.authorize(credentialRequest);

    if (
      credentialResponse.errorMessage === 'Internal' ||
      !credentialResponse.isAuthorized ||
      !credentialResponse.patToken
    ) {
      throw new Error(credentialResponse.errorMessage || 'Authorization not granted');
    }

    return PersonalAccessToken.create(credentialResponse.patToken);
  }
}

export const GIT_CREDENTIAL_PROVIDER = Symbol('IGitCredentialProvider');
