import { Inject, Injectable } from '@nestjs/common';

import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';

import { IRepositoryAuthorizer } from './interfaces/repository-authorizer.as.interface';

import { GetGitCredentialRequest } from '../DTOs/models/requests/get-git-credential-request.model';
import { GetGitCredentialResponse } from '../DTOs/models/responses/get-git-credential-response.model';

import type { IGitCredentialReadPort } from '../ports/repositories/git-credential-read-port.repository';
import { GIT_CREDENTIAL_READ_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { ConfigService } from '@nestjs/config';

interface AuthorizationStrategy {
  getPersonalAccessToken(url?: RepoURL): Promise<string>
}

class PrivateAuthorizationStrategy implements AuthorizationStrategy {
  constructor(
    private readonly credentialPort: IGitCredentialReadPort,
    private readonly password: PATPassword
  ) {}

  async getPersonalAccessToken(url: RepoURL): Promise<string> {
    if (!url) {
          throw new Error('URL is required for private repository authorization');
        }
    
    const credentialRequest: GetGitCredentialRequest = new GetGitCredentialRequest(url, this.password);
    const credentialResponse: GetGitCredentialResponse =
      await this.credentialPort.authorize(credentialRequest);   
      
      if (
      credentialResponse.errorMessage ||
      !credentialResponse.isAuthorized ||
      !credentialResponse.patToken
    ) {
      throw new Error(credentialResponse.errorMessage || 'Authorization not granted');
    }

    return credentialResponse.patToken;
  }
}

class PublicAuthorizationStrategy implements AuthorizationStrategy {
  constructor(
    private readonly configService: ConfigService
  ) {}

  async getPersonalAccessToken(): Promise<string> {
    const pat = this.configService.get<string>('CODE_GUARDIAN_TOKEN');
    if(!pat) {
      throw new Error('Public analysis requested but GITHUB_PUBLIC_TOKEN is not configured');
    }

    return pat;
  }
}

@Injectable()
export class GitAuthorizerService implements IRepositoryAuthorizer {
  constructor(
    @Inject(GIT_CREDENTIAL_READ_PORT)
    private readonly credentialPort: IGitCredentialReadPort,
    private readonly configService: ConfigService,
  ) {}

  public async authorize(url: RepoURL, password?: PATPassword): Promise<PersonalAccessToken> {
    const strategy: AuthorizationStrategy = password
      ? new PrivateAuthorizationStrategy(this.credentialPort, password)
      : new PublicAuthorizationStrategy(this.configService);

    const token = await strategy.getPersonalAccessToken(url);

    return PersonalAccessToken.create(token);
  }
}

export const ACCESS_AUTHORIZER = Symbol('IRepositoryAuthorizer');
