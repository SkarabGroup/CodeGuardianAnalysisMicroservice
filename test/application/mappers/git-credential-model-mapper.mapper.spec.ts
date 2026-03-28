import { GitCredentialModelMapper } from '../../../src/application/mappers/git-credential-model-mapper.mapper';
import { GitCredentialModel } from '../../../src/application/DTOs/models/git-credential-model.model';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';
import { PATPasswordMock } from '../../../src/domain/value-objects/personal-access-token-password.mock';

const mockRepoUrl = { value: 'https://github.com/org/repo' } as RepoURL;
const mockPatPassword = { value: 'mocked-pat-password' } as PATPasswordMock;

describe('GitCredentialModelMapper', () => {
  describe('toModel', () => {
    it('should return a GitCredentialModel instance with all fields mapped', () => {
      const result = GitCredentialModelMapper.toModel(mockRepoUrl, mockPatPassword);

      expect(result).toBeInstanceOf(GitCredentialModel);
      expect(result.repositoryUrl).toBe('https://github.com/org/repo');
      expect(result.patPassword).toBe('mocked-pat-password');
    });
  });
});
