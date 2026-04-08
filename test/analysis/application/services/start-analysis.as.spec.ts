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
import { PASSWORD_PROVIDER } from '../../../../src/analysis/domain/services/pat-password-provider.ds';

describe('StartAnalysisService', () => {
  let service: StartAnalysisService;

  const mockAuthorizer = {
    authorize: jest.fn(),
  };

  const mockValidator = {
    check: jest.fn(),
  };

  const mockCloner = {
    clone: jest.fn(),
  };

  const mockProvider = {
    generate: jest.fn(),
  };

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
      ],
    }).compile();

    service = module.get<StartAnalysisService>(StartAnalysisService);

    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should orchestrate full flow correctly', async () => {
    const token = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));
    const branch = BranchName.create('main');
    const commit = CommitHash.create('a'.repeat(40));
    const path = '/tmp/repo';
    const expectedHash = createHash('sha256').update(PASSWORD).digest('hex');

    // Istruiamo il provider a restituire un oggetto che contenga l'hash
    mockProvider.generate.mockReturnValue({ _value: expectedHash });

    mockAuthorizer.authorize.mockResolvedValue(token);
    mockValidator.check.mockResolvedValue({ branch, commit });
    mockCloner.clone.mockResolvedValue(path);

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
      password: PASSWORD,
      branch: 'main',
    });

    const result = await service.execute(command);

    expect(result.success).toBe(true);
    expect(result.message).toBe(path);

    expect(mockAuthorizer.authorize).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ _value: expectedHash }),
    );

    expect(mockValidator.check).toHaveBeenCalledWith(
      expect.any(Object),
      token,
      expect.objectContaining({ _value: 'main' }),
      null,
    );

    expect(mockCloner.clone).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      token,
      branch,
      commit,
    );
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

  it('should pass branch and commit when provided', async () => {
    const token = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));

    mockAuthorizer.authorize.mockResolvedValue(token);
    mockValidator.check.mockResolvedValue({
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

    expect(mockValidator.check).toHaveBeenCalledWith(
      expect.any(RepoURL),
      token,
      expect.objectContaining({ value: 'develop' }),
      expect.objectContaining({ value: 'c'.repeat(40) }),
    );
  });

  it('should propagate validator errors', async () => {
    const token = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));

    mockAuthorizer.authorize.mockResolvedValue(token);
    mockValidator.check.mockRejectedValue(new Error('Validation failed'));

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
      password: PASSWORD,
    });

    await expect(service.execute(command)).rejects.toThrow('Validation failed');
  });

  it('should propagate cloner errors', async () => {
    const token = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));

    mockAuthorizer.authorize.mockResolvedValue(token);
    mockValidator.check.mockResolvedValue({
      branch: BranchName.create('main'),
      commit: CommitHash.create('a'.repeat(40)),
    });
    mockCloner.clone.mockRejectedValue(new Error('Clone failed'));

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
    });

    await expect(service.execute(command)).rejects.toThrow('Clone failed');
  });

  it('should call services in correct order', async () => {
    const token = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));

    mockAuthorizer.authorize.mockResolvedValue(token);
    mockValidator.check.mockResolvedValue({
      branch: BranchName.create('main'),
      commit: CommitHash.create('a'.repeat(40)),
    });
    mockCloner.clone.mockResolvedValue('/tmp/path');

    const command = new StartAnalysisCommand({
      url: VALID_URL,
      user: VALID_USER,
    });

    await service.execute(command);

    const authorizeOrder = mockAuthorizer.authorize.mock.invocationCallOrder[0];
    const validatorOrder = mockValidator.check.mock.invocationCallOrder[0];
    const clonerOrder = mockCloner.clone.mock.invocationCallOrder[0];

    expect(authorizeOrder).toBeLessThan(validatorOrder);
    expect(validatorOrder).toBeLessThan(clonerOrder);
  });

  it('should be instantiated correctly', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(StartAnalysisService);
  });
});
