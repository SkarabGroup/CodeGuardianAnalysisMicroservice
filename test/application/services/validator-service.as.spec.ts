import { Test, TestingModule } from '@nestjs/testing';
import { ValidatorService } from '../../../src/application/services/validator-service.as';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { ValidationModel } from '../../../src/application/DTOs/models/responses/validation-model.model';
import {
  PAT_PASSWORD_GENERATOR,
  PERSONAL_ACCESS_TOKEN_GENERATOR,
} from '../../../src/domain/services/domain-objects-provider.ds';
import { GIT_CREDENTIAL_READ_PORT } from '../../../src/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GITHUB_AVAILABILITY_PORT } from '../../../src/infrastructure/adapters/externals/github-adapter.adapter';

describe('ValidatorService.validateAccess', () => {
  let service: ValidatorService;

  // Define mock objects
  const mockPatPasswordGenerator = { createPATPasswordVO: jest.fn() };
  const mockPersonalAccessTokenGenerator = { createPersonalAccessTokenVO: jest.fn() };
  const mockGitCredentialPort = { authorize: jest.fn() };
  const mockGitHubAvailabilityPort = { check: jest.fn() };

  // Analysis mock builder
  const makeAnalysis = (
    overrides: {
      repoUrl?: string;
      branch?: string | null;
      commit?: string | null;
    } = {},
  ): jest.Mocked<GitHubAnalysis> => {
    const { repoUrl = 'https://github.com/org/repo', branch = 'main', commit = null } = overrides;

    return {
      getRepoURL: jest.fn().mockReturnValue({ value: repoUrl }),
      getBranch: jest.fn().mockReturnValue(branch ? { value: branch } : null),
      getCommit: jest.fn().mockReturnValue(commit ? { value: commit } : null),
    } as unknown as jest.Mocked<GitHubAnalysis>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidatorService,
        { provide: PAT_PASSWORD_GENERATOR, useValue: mockPatPasswordGenerator },
        { provide: PERSONAL_ACCESS_TOKEN_GENERATOR, useValue: mockPersonalAccessTokenGenerator },
        { provide: GIT_CREDENTIAL_READ_PORT, useValue: mockGitCredentialPort },
        { provide: GITHUB_AVAILABILITY_PORT, useValue: mockGitHubAvailabilityPort },
      ],
    }).compile();

    service = module.get(ValidatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Tests ---

  it('skips PAT validation entirely when patPassword is empty', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    const result = await service.validateAccess(makeAnalysis(), '');

    expect(mockPatPasswordGenerator.createPATPasswordVO).not.toHaveBeenCalled();
    expect(mockGitCredentialPort.authorize).not.toHaveBeenCalled();
    expect(result).toEqual(new ValidationModel(true, null, 'Access validated successfully.'));
  });

  it('returns failure when createPATPasswordVO throws (invalid format)', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockImplementationOnce(() => {
      throw new Error('invalid format');
    });

    const result = await service.validateAccess(makeAnalysis(), 'bad-pat');

    expect(result).toEqual(new ValidationModel(false, null, 'Invalid PAT password format.'));
    expect(mockGitCredentialPort.authorize).not.toHaveBeenCalled();
  });

  it('returns failure when gitCredentialPort returns not authorized', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockReturnValueOnce({ value: 'hashed-pat' });
    mockGitCredentialPort.authorize.mockResolvedValueOnce({
      isAuthorized: false,
      errorMessage: 'Invalid credentials.',
    });

    const result = await service.validateAccess(makeAnalysis(), 'my-pat');

    expect(result).toEqual(new ValidationModel(false, null, 'Invalid credentials.'));
    expect(mockGitHubAvailabilityPort.check).not.toHaveBeenCalled();
  });

  it('returns failure when availability check fails', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: false,
      errorMessage: 'Repository not found.',
    });

    const result = await service.validateAccess(makeAnalysis(), '');

    expect(result).toEqual(new ValidationModel(false, null, 'Repository not found.'));
  });

  it('builds availability request with full data when PAT flow succeeds', async () => {
    // 1. Setup mocks to trigger the full flow
    mockPatPasswordGenerator.createPATPasswordVO.mockReturnValueOnce({ value: 'hashed-pat' });
    mockGitCredentialPort.authorize.mockResolvedValueOnce({
      isAuthorized: true,
      patToken: 'encrypted-token-from-db', // Crucial: must exist for the next line to trigger
      errorMessage: null,
    });
    mockPersonalAccessTokenGenerator.createPersonalAccessTokenVO.mockReturnValueOnce({
      value: 'raw-token-abc',
    });
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    const analysis = makeAnalysis({ repoUrl: 'url', branch: 'feat', commit: '123' });
    await service.validateAccess(analysis, 'user-input-pass');

    // 2. Verify the request sent to GitHub Port
    expect(mockGitHubAvailabilityPort.check).toHaveBeenCalledWith(
      expect.objectContaining({
        repoUrl: 'url',
        patToken: 'raw-token-abc',
        branch: 'feat',
        commit: '123',
      }),
    );
  });

  it('returns success with patToken value when full PAT flow succeeds', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockReturnValueOnce({ value: 'hashed-pat' });
    mockGitCredentialPort.authorize.mockResolvedValueOnce({
      isAuthorized: true,
      patToken: 'token-string', // Added this
      errorMessage: null,
    });
    mockPersonalAccessTokenGenerator.createPersonalAccessTokenVO.mockReturnValueOnce({
      value: 'decrypted-token',
    });
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    const result = await service.validateAccess(makeAnalysis(), 'my-pat');

    expect(result).toEqual(
      new ValidationModel(true, 'decrypted-token', 'Access validated successfully.'),
    );
  });
});
