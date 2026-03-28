import { GithubAnalysisMapper } from '../../../src/application/mappers/github-analysis-mapper.mapper';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { GithubAnalysisModel } from '../../../src/application/DTOs/models/github-analysis-model.model';

const mockEntity = (withCommit: boolean): GitHubAnalysis =>
  ({
    getAnalysisId: () => ({ value: 'analysis-123' }),
    getUserId: () => ({ value: 'user-456' }),
    getStatus: () => 'PENDING',
    getBranch: () => ({ value: 'main' }),
    getRepoURL: () => ({ value: 'https://github.com/org/repo' }),
    getCommit: () => (withCommit ? { value: 'abc123' } : null),
  }) as unknown as GitHubAnalysis;

describe('GithubAnalysisMapper', () => {
  describe('toModel', () => {
    it('should map entity to model with commit value when commit is present', () => {
      const entity = mockEntity(true);

      const result = GithubAnalysisMapper.toModel(entity);

      expect(result).toBeInstanceOf(GithubAnalysisModel);
      expect(result).toEqual(
        new GithubAnalysisModel(
          'analysis-123',
          'user-456',
          'PENDING',
          'main',
          'https://github.com/org/repo',
          'abc123',
        ),
      );
    });

    it('should map entity to model with null commit when commit is absent', () => {
      const entity = mockEntity(false);

      const result = GithubAnalysisMapper.toModel(entity);

      expect(result).toBeInstanceOf(GithubAnalysisModel);
      expect(result).toEqual(
        new GithubAnalysisModel(
          'analysis-123',
          'user-456',
          'PENDING',
          'main',
          'https://github.com/org/repo',
          null,
        ),
      );
    });
  });
});
