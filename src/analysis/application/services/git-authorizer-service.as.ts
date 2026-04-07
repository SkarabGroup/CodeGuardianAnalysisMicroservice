import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PATPassword } from '../../domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../domain/value-objects/repo-url.vo';

import { IRepositoryAuthorizer } from './interfaces/repository-authorizer.as.interface';

import { GetGitCredentialRequest } from '../DTOs/models/requests/get-git-credential-request.model';
import { GetGitCredentialResponse } from '../DTOs/models/responses/get-git-credential-response.model';

import type { IGitCredentialReadPort } from '../ports/repositories/git-credential-read-port.repository';
import { GIT_CREDENTIAL_READ_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';

interface AuthorizationStrategy {
  getPersonalAccessToken(url?: RepoURL): Promise<string>;
}

class PrivateAuthorizationStrategy implements AuthorizationStrategy {
  constructor(
    private readonly port: IGitCredentialReadPort,
    private readonly password: PATPassword,
  ) {}

  async getPersonalAccessToken(url: RepoURL): Promise<string> {
    if (!url) {
      throw new Error('URL is required for private repository authorization');
    }

    const request: GetGitCredentialRequest = new GetGitCredentialRequest(url, this.password);
    const response: GetGitCredentialResponse = await this.port.authorize(request);

    if (response.errorMessage || !response.isAuthorized || !response.patToken) {
      throw new Error(response.errorMessage || 'Authorization not granted');
    }

    return response.patToken;
  }
}

class PublicAuthorizationStrategy implements AuthorizationStrategy {
  constructor(private readonly configService: ConfigService) {}

  getPersonalAccessToken(): Promise<string> {
    const pat = this.configService.get<string>('CODE_GUARDIAN_TOKEN');
    if (!pat) {
      throw new Error('Public analysis requested but GITHUB_PUBLIC_TOKEN is not configured');
    }

    return Promise.resolve(pat);
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
