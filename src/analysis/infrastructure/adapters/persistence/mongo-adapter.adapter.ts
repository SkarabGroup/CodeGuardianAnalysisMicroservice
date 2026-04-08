import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetGitCredentialRequest } from '../../../application/DTOs/models/requests/get-git-credential-request.model';
import { IGitCredentialReadPort } from '../../../application/ports/repositories/git-credential-read-port.repository';
import { GitCredential, GitCredentialDocument } from './schema/github-repo-credentials.schema';
import { GetGitCredentialResponse } from '../../../application/DTOs/models/responses/get-git-credential-response.model';
import { IGitCredentialSavePort } from '../../../application/ports/repositories/git-save-credential-port.repository';
import { PostGitCredentialRequest } from '../../../application/DTOs/models/requests/post-git-credential-request.model';
import { PostGitCredentialResponse } from '../../../application/DTOs/models/responses/post-git-credential-result.model';
import { DeleteGitCredentialRequest } from '../../../application/DTOs/models/requests/delete-git-credential-request.model';
import { DeleteGitCredentialResponse } from '../../../application/DTOs/models/responses/delete-git-credential-response.model';
import { UpdateGitCredentialPatRequest } from '../../../application/DTOs/models/requests/update-git-credential-pat-request.model';
import { UpdateGitCredentialPatResponse } from '../../../application/DTOs/models/responses/update-git-credential-pat-response.model';
import { IGitCredentialDeletePort } from '../../../application/ports/repositories/git-delete-credential-port.repository';
import { IGitCredentialUpdatePort } from '../../../application/ports/repositories/git-update-credential-port.repository';
@Injectable() //Get
//Post
// Delete
// Update
export class MongoDBAdapter
  implements
    IGitCredentialReadPort,
    IGitCredentialSavePort,
    IGitCredentialDeletePort,
    IGitCredentialUpdatePort
{
  public constructor(
    @InjectModel(GitCredential.name, 'DatabaseConnection')
    private readonly credentialModel: Model<GitCredentialDocument>,
  ) {}

  async authorize(model: GetGitCredentialRequest): Promise<GetGitCredentialResponse> {
    try {
      const credential = await this.credentialModel
        .findOne({ repoUrl: model.repoUrl.value })
        .lean()
        .exec();

      if (!credential) {
        return GetGitCredentialResponse.failure(
          'Credential not found for the specified repository URL',
        );
      }

      console.log(credential.password);
      const isValid = model.password.value === credential.password;

      return isValid
        ? GetGitCredentialResponse.success(credential.patToken)
        : GetGitCredentialResponse.failure('Wrong password');
    } catch (error) {
      return GetGitCredentialResponse.failure(
        `Connection error database: ${(error as Error).message}`,
      );
    }
  }

  async save(model: PostGitCredentialRequest): Promise<PostGitCredentialResponse> {
    try {
      await this.credentialModel.create({
        repoUrl: model.repoUrl.value,
        password: model.password.value,
        patToken: model.pat.value,
      });

      return PostGitCredentialResponse.success();
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return PostGitCredentialResponse.failure(
          `Credentials for repository ${model.repoUrl.value} already exist.`,
        );
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      return PostGitCredentialResponse.failure(`Error during saving: ${message}`);
    }
  }

  async deletePAT(request: DeleteGitCredentialRequest): Promise<DeleteGitCredentialResponse> {
    try {
      await this.credentialModel.deleteOne({
        repoUrl: request.repoUrl.value,
        password: request.patPassword.value,
      });
      return DeleteGitCredentialResponse.success();
    } catch (error) {
      return DeleteGitCredentialResponse.failure(
        `Connection to database failed: ${(error as Error).message}`,
      );
    }
  }

  async updatePAT(request: UpdateGitCredentialPatRequest): Promise<UpdateGitCredentialPatResponse> {
    try {
      const result = await this.credentialModel.updateOne(
        { repoUrl: request.repoUrl.value, password: request.patPassword.value },
        { patToken: request.newPat.value },
      );

      if (result.matchedCount === 0) {
        return UpdateGitCredentialPatResponse.failure(
          'Credentials not found or incorrect password',
        );
      }

      return UpdateGitCredentialPatResponse.success();
    } catch (error) {
      return UpdateGitCredentialPatResponse.failure(
        `Error updating token: ${(error as Error).message}`,
      );
    }
  }
}

export const GIT_CREDENTIAL_READ_PORT = Symbol('IGitCredentialReadPort');
export const GIT_CREDENTIAL_SAVE_PORT = Symbol('IGitCredentialSavePort');
export const GIT_CREDENTIAL_DELETE_PORT = Symbol('IGitCredentialDeletePort');
export const GIT_CREDENTIAL_UPDATE_PORT = Symbol('IGitCredentialUpdatePort');
