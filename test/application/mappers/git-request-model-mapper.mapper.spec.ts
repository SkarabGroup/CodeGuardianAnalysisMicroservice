import { GitRequestModelMapper } from '../../../src/application/mappers/git-request-model-mapper.mapper';
import { GitRequestModel } from '../../../src/application/DTOs/models/git-request-model.model';
import { BranchName } from '../../../src/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../src/domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../../src/domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';

const mockBranch = { value: 'main' } as BranchName;
const mockRepoUrl = { value: 'https://github.com/org/repo' } as RepoURL;
const mockCommitHash = { value: 'abc123' } as CommitHash;
const mockToken = { value: 'ghp_token123' } as PersonalAccessToken;

describe('GitRequestModelMapper', () => {
  describe('toModel', () => {
    it('should return a GitRequestModel instance with all fields mapped', () => {
      const result = GitRequestModelMapper.toModel(
        mockBranch,
        mockRepoUrl,
        mockCommitHash,
        mockToken,
      );

      expect(result).toBeInstanceOf(GitRequestModel);
      expect(result.repositoryUrl).toBe('https://github.com/org/repo');
      expect(result.branchName).toBe('main');
      expect(result.commitHash).toBe('abc123');
      expect(result.personalAccessToken).toBe('ghp_token123');
    });

    it('should set commitHash to null when commitHash is omitted', () => {
      const result = GitRequestModelMapper.toModel(mockBranch, mockRepoUrl, undefined, mockToken);

      expect(result.commitHash).toBeNull();
    });

    it('should set personalAccessToken to null when token is omitted', () => {
      const result = GitRequestModelMapper.toModel(mockBranch, mockRepoUrl, mockCommitHash);

      expect(result.personalAccessToken).toBeNull();
    });

    it('should set both commitHash and personalAccessToken to null when both are omitted', () => {
      const result = GitRequestModelMapper.toModel(mockBranch, mockRepoUrl);

      expect(result.commitHash).toBeNull();
      expect(result.personalAccessToken).toBeNull();
    });
  });
});
