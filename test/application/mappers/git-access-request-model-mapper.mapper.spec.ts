import { GitAccessRequestModelMapper } from '../../../src/application/mappers/git-access-request-model-mapper.mapper';
import { GitAccessRequestModel } from '../../../src/application/DTOs/models/git-access-request-model.model';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';
import { PersonalAccessToken } from '../../../src/domain/value-objects/personal-access-token.vo';

const mockRepoUrl = RepoURL.create('https://github.com/user/repo.git');
const mockPat = PersonalAccessToken.create('github_pat_' + 'a'.repeat(82));

describe('GitAccessRequestModelMapper', () => {
  describe('toModel', () => {
    it('should map RepoURL and PersonalAccessToken to GitAccessRequestModel', () => {
      const result = GitAccessRequestModelMapper.toModel(mockRepoUrl, mockPat);

      expect(result).toBeInstanceOf(GitAccessRequestModel);
      expect(result.repositoryUrl).toBe(mockRepoUrl.value);
      expect(result.patPassword).toBe(mockPat.value);
    });
  });
});
