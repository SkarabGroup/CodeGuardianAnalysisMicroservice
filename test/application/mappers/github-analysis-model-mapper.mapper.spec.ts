import { GithubAnalysisMapper } from '../../../src/application/mappers/github-analysis-model-mapper.mapper';
import { GithubAnalysisModel } from '../../../src/application/DTOs/models/github-analysis-model.model';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';

const mockEntity = (withCommit: boolean): GitHubAnalysis =>
  ({
    getAnalysisId: () => ({ value: 'analysis-123' }),
    getUserId: () => ({ value: 'user-456' }),
    getStatus: () => 'PENDING',
    getRepoURL: () => ({ value: 'https://github.com/org/repo' }),
    getBranch: () => ({ value: 'main' }),
    getCommit: () => (withCommit ? { value: 'abc123' } : null),
  }) as unknown as GitHubAnalysis;

describe('GithubAnalysisMapper', () => {
  describe('toModel', () => {
    it('should map all entity fields to model properties', () => {
      const result = GithubAnalysisMapper.toModel(mockEntity(true));

      expect(result).toBeInstanceOf(GithubAnalysisModel);
      expect(result.analysisId).toBe('analysis-123');
      expect(result.userId).toBe('user-456');
      expect(result.status).toBe('PENDING');
      expect(result.branchName).toBe('main');
      expect(result.repositoryUrl).toBe('https://github.com/org/repo');
      expect(result.commitHash).toBe('abc123');
    });

    it('should set commitHash to null when entity has no commit', () => {
      const result = GithubAnalysisMapper.toModel(mockEntity(false));

      expect(result.commitHash).toBeNull();
    });
  });
});
