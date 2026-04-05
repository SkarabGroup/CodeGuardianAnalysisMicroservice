import { Test, TestingModule } from '@nestjs/testing';
import { StartAnalysisService } from '../../../../src/analysis/application/services/start-analysis.as';
import { ANALYSIS_PROVIDER } from '../../../../src/analysis/domain/services/analysis-provider.ds';
import { ACCESS_AUTHORIZER } from '../../../../src/analysis/application/services/git-access-service.as';
import { CLONE_VALIDATOR } from '../../../../src/analysis/application/services/git-clone-validator-service.as';
import { StartAnalysisCommand } from '../../../../src/analysis/application/commands/start-analysis-command.command';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { REPOSITORY_CLONER } from '../../../../src/analysis/application/services/git-cloner-service.as';

const mockAnalysisFactory = {
  createGitHubAnalysisEntity: jest.fn(),
};

const mockAuthorizer = {
  authorize: jest.fn(),
};

const mockCloneValidator = {
  check: jest.fn(),
};

const mockCloner = {
  clone: jest.fn(),
};

describe('StartAnalysisService Use Case - Orchestration Coverage', () => {
  let useCase: StartAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartAnalysisService,
        { provide: ANALYSIS_PROVIDER, useValue: mockAnalysisFactory },
        { provide: ACCESS_AUTHORIZER, useValue: mockAuthorizer },
        { provide: CLONE_VALIDATOR, useValue: mockCloneValidator },
        { provide: REPOSITORY_CLONER, useValue: mockCloner },
      ],
    }).compile();

    useCase = module.get<StartAnalysisService>(StartAnalysisService);
    jest.clearAllMocks();
  });

  const createMockEntity = (overrides = {}) =>
    ({
      getRepoURL: () => RepoURL.create('https://github.com/user/repo'),
      getBranch: () => null,
      getCommit: () => null,
      getAnalysisId: () => ({ value: 'analysis-123' }),
      ...overrides,
    }) as unknown as GitHubAnalysis;

  it('should return failure if analysis factory fails', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'invalid' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockImplementation(() => {
      throw new Error('Invalid Repository URL');
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Invalid Repository URL');
  });

  it('should return failure if authorizer service throws an error', async () => {
    const command = new StartAnalysisCommand({
      userId: 'u1',
      repositoryUrl: 'url',
      patPassword: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockAuthorizer.authorize.mockRejectedValue(new Error('Authorization not granted'));

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Authorization not granted');
  });

  it('should return failure if clone validator service throws an error', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'url' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockCloneValidator.check.mockRejectedValue(new Error('Source repository is not accessible'));

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Source repository is not accessible');
  });

  it('should return success with resolved commit hash when all services succeed', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'url' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockCloneValidator.check.mockResolvedValue(CommitHash.create('a'.repeat(40)));

    const result = await useCase.execute(command);

    expect(result.isSuccess).toBe(true);
    expect(mockCloneValidator.check).toHaveBeenCalled();
  });

  it('should pass PAT to validator if patPassword was provided and authorized', async () => {
    const command = new StartAnalysisCommand({
      userId: 'u1',
      repositoryUrl: 'url',
      patPassword: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    const mockEntity = createMockEntity();
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(mockEntity);

    const mockToken = { value: 'ghp_token' };
    mockAuthorizer.authorize.mockResolvedValue(mockToken);
    mockCloneValidator.check.mockResolvedValue(CommitHash.create('a'.repeat(40)));

    await useCase.execute(command);

    expect(mockAuthorizer.authorize).toHaveBeenCalled();
    expect(mockCloneValidator.check).toHaveBeenCalledWith(
      mockEntity.getRepoURL(),
      mockToken,
      null,
      null,
    );
  });
});
