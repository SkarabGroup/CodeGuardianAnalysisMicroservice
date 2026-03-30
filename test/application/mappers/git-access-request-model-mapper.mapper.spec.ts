import { GitAccessRequestModelMapper } from '../../../src/application/mappers/git-access-request-model-mapper.mapper';
import { GitAccessRequestModel } from '../../../src/application/DTOs/models/git-access-request-model.model';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';
import { PersonalAccessToken } from '../../../src/domain/value-objects/personal-access-token.vo';
import { CommitHash } from '../../../src/domain/value-objects/commit-hash.vo';
import { BranchName } from '../../../src/domain/value-objects/branch-name.vo';

const mockRepoUrl = RepoURL.create('https://github.com/user/repo.git');
const mockPat = PersonalAccessToken.create('github_pat_' + 'a'.repeat(82));
const mockBranchName = BranchName.create('main'); // Mocking BranchName value object
const mockCommitHash = CommitHash.create('a'.repeat(40)); // Mocking CommitHash value object

describe('GitAccessRequestModelMapper', () => {
  describe('toModel', () => {
    it('should map RepoURL and PersonalAccessToken to GitAccessRequestModel', () => {
      const result = GitAccessRequestModelMapper.toModel(
        mockRepoUrl,
        mockPat,
        mockBranchName,
        mockCommitHash,
      );

      expect(result).toBeInstanceOf(GitAccessRequestModel);
      expect(result.repositoryUrl).toBe(mockRepoUrl.value);
      expect(result.branchName).toBe(mockBranchName.value);
      expect(result.commitHash).toBe(mockCommitHash.value);
      expect(result.personalAccessToken).toBe(mockPat.value);
    });
  });
});
