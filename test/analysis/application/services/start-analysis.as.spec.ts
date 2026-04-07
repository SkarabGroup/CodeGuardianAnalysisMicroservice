import { Test, TestingModule } from '@nestjs/testing';
import { StartAnalysisService } from '../../../../src/analysis/application/services/start-analysis.as';
import { ACCESS_AUTHORIZER } from '../../../../src/analysis/application/services/git-authorizer-service.as';
import { CLONE_VALIDATOR } from '../../../../src/analysis/application/services/git-validator-service.as';
import { REPOSITORY_CLONER } from '../../../../src/analysis/application/services/git-cloner-service.as';
import { StartAnalysisCommand } from '../../../../src/analysis/application/commands/start-analysis-command.command';

import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../../src/analysis/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';

import { createHash } from 'crypto';
import { v7 as uuid } from 'uuid';

const mockAuthorizer = {
  authorize: jest.fn(),
};

const mockCloneValidator = {
  check: jest.fn(),
};

const mockCloner = {
  clone: jest.fn(),
};

describe('StartAnalysisService Orchestration', () => {
  let service: StartAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartAnalysisService,
        { provide: ACCESS_AUTHORIZER, useValue: mockAuthorizer },
        { provide: CLONE_VALIDATOR, useValue: mockCloneValidator },
        { provide: REPOSITORY_CLONER, useValue: mockCloner },
      ],
    }).compile();

    service = module.get<StartAnalysisService>(StartAnalysisService);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  const VALID_URL = 'https://github.com/owner/repo';
  const VALID_USER = uuid();
  const PLAIN_PASS = 'password123';
  const HASHED_PASS = createHash('sha256').update(PLAIN_PASS).digest('hex');

  it('should orchestrate the full analysis flow successfully', async () => {
    // 1. Setup Mocks
    const mockToken = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));
    const mockBranch = BranchName.create('main');
    const mockCommit = CommitHash.create('a'.repeat(40));
    const mockPath = '/tmp/local-repo';

    mockAuthorizer.authorize.mockResolvedValue(mockToken);
    mockCloneValidator.check.mockResolvedValue({
      branch: mockBranch,
      commit: mockCommit,
    });
    mockCloner.clone.mockResolvedValue(mockPath);

    // 2. Comando con struttura corretta (oggetto data)
    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
      password: PLAIN_PASS,
      branch: 'main',
    });

    // 3. Esecuzione
    const result = await service.execute(command);

    // 4. Asserzioni sul risultato
    expect(result.success).toBe(true);
    expect(result.message).toBe(mockPath);
    expect(result.branch).toBe('main');

    // 5. Verifica orchestrazione con arrow functions per evitare unbound-method
    expect(() => mockAuthorizer.authorize).toHaveBeenCalledWith(
      expect.any(RepoURL),
      expect.objectContaining({ value: HASHED_PASS }),
    );

    expect(() => mockCloneValidator.check).toHaveBeenCalledWith(
      expect.any(RepoURL),
      mockToken,
      expect.any(BranchName),
      null,
    );

    expect(() => mockCloner.clone).toHaveBeenCalledWith(
      expect.any(RepoURL),
      expect.any(Object), // AnalysisId
      mockToken,
      mockBranch,
      mockCommit,
    );
  });

  it('should handle public repositories (no password provided)', async () => {
    mockAuthorizer.authorize.mockResolvedValue(null);
    mockCloneValidator.check.mockResolvedValue({
      branch: BranchName.create('main'),
      commit: CommitHash.create('b'.repeat(40)),
    });
    mockCloner.clone.mockResolvedValue('/tmp/path');

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
    });

    await service.execute(command);

    expect(() => mockAuthorizer.authorize).toHaveBeenCalledWith(expect.any(RepoURL), undefined);
  });

  it('should propagate errors from internal services', async () => {
    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
      password: PLAIN_PASS,
    });

    const error = new Error('Validation failed');
    mockAuthorizer.authorize.mockResolvedValue(null);
    mockCloneValidator.check.mockRejectedValue(error);

    await expect(service.execute(command)).rejects.toThrow('Validation failed');
  });

  it('should correctly pass provided branch and commit to validator', async () => {
    mockAuthorizer.authorize.mockResolvedValue(null);
    mockCloneValidator.check.mockResolvedValue({
      branch: BranchName.create('develop'),
      commit: CommitHash.create('c'.repeat(40)),
    });
    mockCloner.clone.mockResolvedValue('/tmp/path');

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
      branch: 'develop',
      commit: 'c'.repeat(40),
    });

    await service.execute(command);

    expect(() => mockCloneValidator.check).toHaveBeenCalledWith(
      expect.objectContaining({ value: VALID_URL }),
      null,
      expect.objectContaining({ value: 'develop' }),
      expect.objectContaining({ value: 'c'.repeat(40) }),
    );
  });
});
