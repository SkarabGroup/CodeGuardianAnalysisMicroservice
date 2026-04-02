import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetGitCredentialRequest } from '../../../application/DTOs/models/requests/get-git-credential-request.model';
import { IGitCredentialReadPort } from '../../../application/ports/repositories/git-credential-read-port.repository';
import { GitCredential, GitCredentialDocument } from './schema/github-repo-credentials.schema';
import { GetGitCredentialResponse } from '../../../application/DTOs/models/responses/get-git-credential-response.model';
import { IGitCredentialWritePort } from '../../../application/ports/repositories/post-credential-write-port.repository';
import { PostGitCredentialRequest } from '../../../application/DTOs/models/requests/post-git-credential-request.model';
import { PostGitCredentialResponse } from '../../../application/DTOs/models/responses/post-git-credential-result.model';

@Injectable() // Fondamentale per NestJS
export class MongoDBAdapter implements IGitCredentialReadPort, IGitCredentialWritePort {
  public constructor(
    @InjectModel(GitCredential.name)
    private readonly credentialModel: Model<GitCredentialDocument>,
  ) {}

  async authorize(model: GetGitCredentialRequest): Promise<GetGitCredentialResponse> {
    try {
      const credential = await this.credentialModel
        .findOne({
          repoUrl: model.repoUrl,
          password: model.password,
        })
        .lean()
        .exec();

      if (!credential) {
        return new GetGitCredentialResponse(
          null,
          false,
          'Credenziali non trovate o password errata',
        );
      }

      return new GetGitCredentialResponse(credential.patToken, true);
    } catch (error) {
      return new GetGitCredentialResponse(
        null,
        false,
        `Errore di connessione al database: ${(error as Error).message}`,
      );
    }
  }

  async save(model: PostGitCredentialRequest): Promise<PostGitCredentialResponse> {
    try {
      await this.credentialModel.create({
        repoUrl: model.repoUrl,
        password: model.password,
        patToken: model.pat,
      });

      return PostGitCredentialResponse.success();
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return PostGitCredentialResponse.failure(
          `Le credenziali per la repository ${model.repoUrl} sono già esistenti.`,
        );
      }

      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      return PostGitCredentialResponse.failure(`Errore durante il salvataggio: ${message}`);
    }
  }
}
