import { PATPasswordMock } from '../../domain/value-objects/personal-access-token-password.mock';
import { GitCredentialModel } from '../DTOs/models/git-credential-model.model';
import { RepoURL } from 'src/domain/value-objects/repo-url.vo';

export class GitCredentialModelMapper {
  public static toModel(repositoryUrl: RepoURL, patPassword: PATPasswordMock): GitCredentialModel {
    return new GitCredentialModel(repositoryUrl.value, patPassword.value);
  }
}
