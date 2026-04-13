import { Test, TestingModule } from '@nestjs/testing';
import { StartAnalysisService } from '../../../../src/analysis/application/services/start-analysis.as';
import { ACCESS_AUTHORIZER } from '../../../../src/analysis/application/services/git-authorizer-service.as';
import { CLONE_VALIDATOR } from '../../../../src/analysis/application/services/git-validator-service.as';
import { REPOSITORY_CLONER } from '../../../../src/analysis/application/services/git-cloner-service.as';
import { ANALYSIS_ORCHESTRATOR } from '../../../../src/analysis/application/services/analysis-orchestrator-service.as';
import { PASSWORD_PROVIDER } from '../../../../src/analysis/domain/services/pat-password-provider.ds';
import { StartAnalysisCommand } from '../../../../src/analysis/application/commands/start-analysis-command.command';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../../src/analysis/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { v7 as uuid } from 'uuid';
import { GITHUB_ANALYSIS_SAVE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';

describe('StartAnalysisService', () => {
  let service: StartAnalysisService;

  const mockAuthorizer = { authorize: jest.fn() };
  const mockValidator = { check: jest.fn() };
  const mockCloner = { clone: jest.fn() };
  const mockProvider = { generate: jest.fn() };
  const mockOrchestrator = { analyze: jest.fn() };
  const mockAnalysisSavePort = { saveAnalysis: jest.fn() };

  const VALID_URL = 'https://github.com/owner/repo';
  const VALID_USER = uuid();
  const PASSWORD = 'password123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartAnalysisService,
        { provide: PASSWORD_PROVIDER, useValue: mockProvider },
        { provide: ACCESS_AUTHORIZER, useValue: mockAuthorizer },
        { provide: CLONE_VALIDATOR, useValue: mockValidator },
        { provide: REPOSITORY_CLONER, useValue: mockCloner },
        { provide: ANALYSIS_ORCHESTRATOR, useValue: mockOrchestrator },
        { provide: GITHUB_ANALYSIS_SAVE_PORT, useValue: mockAnalysisSavePort },
      ],
    }).compile();

    service = module.get<StartAnalysisService>(StartAnalysisService);

    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should orchestrate full flow and call orchestrator correctly', async () => {
    const token = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));
    const branch = BranchName.create('main');
    const commit = CommitHash.create('a'.repeat(40));
    const path = '/tmp/repo';

    mockProvider.generate.mockReturnValue({ value: 'hashed_password' });
    mockAuthorizer.authorize.mockResolvedValue(token);
    mockValidator.check.mockResolvedValue({ branch, commit });
    mockCloner.clone.mockResolvedValue(path);

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
      password: PASSWORD,
      branch: 'main',
      code: true,
      docs: false,
      security: true,
    });

    const result = await service.execute(command);

    expect(result.success).toBe(true);

    // Casting sicuro per evitare l'errore di unsafe member access su any
    const [calledAnalysis, calledPath, code, docs, security] = mockOrchestrator.analyze.mock
      .calls[0] as [GitHubAnalysis, string, boolean, boolean, boolean];

    expect(calledAnalysis.getAnalysisId()).toBeDefined();
    expect(calledAnalysis.getRepoURL().value).toBe(VALID_URL);
    expect(calledPath).toBe(path);
    expect(code).toBe(true);
    expect(docs).toBe(false);
    expect(security).toBe(true);
  });

  it('should handle public repo (no password)', async () => {
    const token = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));
    mockAuthorizer.authorize.mockResolvedValue(token);
    mockValidator.check.mockResolvedValue({
      branch: BranchName.create('main'),
      commit: CommitHash.create('b'.repeat(40)),
    });
    mockCloner.clone.mockResolvedValue('/tmp/path');

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
    });

    await service.execute(command);

    expect(mockAuthorizer.authorize).toHaveBeenCalledWith(expect.any(RepoURL), undefined);
  });

  it('should propagate validator errors and not call orchestrator', async () => {
    mockAuthorizer.authorize.mockResolvedValue(PersonalAccessToken.create('ghp_' + 'A'.repeat(36)));
    mockValidator.check.mockRejectedValue(new Error('Validation failed'));

    const command = new StartAnalysisCommand({ url: VALID_URL, user: VALID_USER });

    await expect(service.execute(command)).rejects.toThrow('Validation failed');
    expect(mockOrchestrator.analyze).not.toHaveBeenCalled();
  });

  it('should call services in correct order including orchestrator at the end', async () => {
    mockAuthorizer.authorize.mockResolvedValue(PersonalAccessToken.create('ghp_' + 'A'.repeat(36)));
    mockValidator.check.mockResolvedValue({
      branch: BranchName.create('main'),
      commit: CommitHash.create('a'.repeat(40)),
    });
    mockCloner.clone.mockResolvedValue('/tmp/path');

    const command = new StartAnalysisCommand({ url: VALID_URL, user: VALID_USER });

    await service.execute(command);

    // Casting a number[] per evitare unsafe member access su invocationCallOrder
    const clonerOrder = mockCloner.clone.mock.invocationCallOrder[0];
    const orchestratorOrder = mockOrchestrator.analyze.mock.invocationCallOrder[0];

    expect(clonerOrder).toBeLessThan(orchestratorOrder);
  });

  it('should be instantiated correctly', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(StartAnalysisService);
  });
});
