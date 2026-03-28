import { AnalysisTransformer } from '../../../../src/application/services/helpers/analysis-transformer.hs';
import { AnalysisType } from '../../../../src/domain/enums/analysis-type.enum';
import { GitHubAnalysisMapper } from '../../../../src/application/mappers/github-analysis-model-mapper.mapper';
import { GitHubAnalysis } from '../../../../src/domain/entities/github-analysis.entity';
import { GitHubAnalysisModel } from '../../../../src/application/DTOs/models/github-analysis-model.model';
import { UserId } from '../../../../src/domain/value-objects/user-id.vo';
import { RepoURL } from '../../../../src/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../../src/domain/value-objects/branch-name.vo';
import { AnalysisStatus } from '../../../../src/domain/enums/analysis-status.enum';
import { Analysis } from '../../../../src/domain/entities/analysis.entity';
import { v4 as uuid } from 'uuid';
describe('AnalysisTransformer', () => {
  let transformer: AnalysisTransformer;

  beforeEach(() => {
    transformer = new AnalysisTransformer();
  });

  it('should delegate mapping to GithubAnalysisMapper when type is GITHUB', () => {
    const githubEntity = GitHubAnalysis.create(
      UserId.create(uuid()),
      RepoURL.create('https://github.com/test/repo.git'),
      BranchName.create('main'),
    );

    const mockModel: GitHubAnalysisModel = {
      analysisId: 'test-id',
      userId: uuid(),
      type: AnalysisType.GITHUB,
      status: AnalysisStatus.IN_PROGRESS,
      repositoryUrl: 'https://github.com/test/repo.git',
      branchName: 'main',
      commitHash: null,
    };

    const mapperSpy = jest.spyOn(GitHubAnalysisMapper, 'toModel').mockReturnValue(mockModel);

    const result = transformer.toAnalysisModel(githubEntity);

    expect(mapperSpy).toHaveBeenCalledWith(githubEntity);
    expect(result).toEqual(mockModel);
    expect(result.analysisId).toBe('test-id');

    mapperSpy.mockRestore();
  });

  it('should throw an error if the analysis type is not supported', () => {
    class UnknownAnalysis extends Analysis {
      constructor() {
        super(UserId.create(uuid()), 'UNKNOWN' as unknown as AnalysisType);
      }
    }

    const unknownEntity = new UnknownAnalysis();

    expect(() => transformer.toAnalysisModel(unknownEntity as Analysis)).toThrow(
      'Analysis type not supported',
    );
  });
});
