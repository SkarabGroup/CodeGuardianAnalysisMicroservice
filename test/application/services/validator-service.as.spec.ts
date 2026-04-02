import { ValidatorService } from '../../../src/application/services/validator-service.as';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { ValidationModel } from '../../../src/application/DTOs/models/responses/validation-model.model';
import {
  PAT_PASSWORD_GENERATOR,
  PERSONAL_ACCESS_TOKEN_GENERATOR,
} from '../../../src/domain/services/domain-objects-provider.ds';
import { GIT_CREDENTIAL_READ_PORT } from '../../../src/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GITHUB_AVAILABILITY_PORT } from '../../../src/infrastructure/adapters/externals/github-adapter.adapter';
import { Test, TestingModule } from '@nestjs/testing';

// ─── Mock factories ───────────────────────────────────────────────────────────

const mockPatPasswordGenerator = {
  createPATPasswordVO: jest.fn(),
};

const mockPersonalAccessTokenGenerator = {
  createPersonalAccessTokenVO: jest.fn(),
};

const mockGitCredentialPort = {
  authorize: jest.fn(),
};

const mockGitHubAvailabilityPort = {
  check: jest.fn(),
};

// ─── Analysis mock builder ────────────────────────────────────────────────────

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

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ValidatorService.validateAccess', () => {
  let service: ValidatorService;

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

  afterEach(() => jest.clearAllMocks());

  // ─── Empty patPassword ──────────────────────────────────────────────────────

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

  it('skips PAT validation when patPassword is only whitespace', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    await service.validateAccess(makeAnalysis(), '   ');

    expect(mockPatPasswordGenerator.createPATPasswordVO).not.toHaveBeenCalled();
  });

  // ─── Invalid PAT format ─────────────────────────────────────────────────────

  it('returns failure when createPATPasswordVO throws (invalid format)', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockImplementationOnce(() => {
      throw new Error('invalid format');
    });

    const result = await service.validateAccess(makeAnalysis(), 'bad-pat');

    expect(result).toEqual(new ValidationModel(false, null, 'Invalid PAT password format.'));
    expect(mockGitCredentialPort.authorize).not.toHaveBeenCalled();
  });

  // ─── Unauthorized ───────────────────────────────────────────────────────────

  it('returns failure when gitCredentialPort returns not authorized with errorMessage', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockReturnValueOnce({ value: 'hashed-pat' });
    mockGitCredentialPort.authorize.mockResolvedValueOnce({
      isAuthorized: false,
      errorMessage: 'Invalid credentials.',
    });

    const result = await service.validateAccess(makeAnalysis(), 'my-pat');

    expect(result).toEqual(new ValidationModel(false, null, 'Invalid credentials.'));
    expect(mockGitHubAvailabilityPort.check).not.toHaveBeenCalled();
  });

  it('returns fallback message when gitCredentialPort returns not authorized without errorMessage', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockReturnValueOnce({ value: 'hashed-pat' });
    mockGitCredentialPort.authorize.mockResolvedValueOnce({
      isAuthorized: false,
      errorMessage: null,
    });

    const result = await service.validateAccess(makeAnalysis(), 'my-pat');

    expect(result).toEqual(
      new ValidationModel(false, null, 'Unauthorized access to the repository.'),
    );
  });

  // ─── Availability check ─────────────────────────────────────────────────────

  it('returns failure when availability check fails with errorMessage', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: false,
      errorMessage: 'Repository not found.',
    });

    const result = await service.validateAccess(makeAnalysis(), '');

    expect(result).toEqual(new ValidationModel(false, null, 'Repository not found.'));
  });

  it('returns fallback message when availability check fails without errorMessage', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: false,
      errorMessage: null,
    });

    const result = await service.validateAccess(makeAnalysis(), '');

    expect(result).toEqual(new ValidationModel(false, null, 'Repository is not available.'));
  });

  // ─── Availability request shape ─────────────────────────────────────────────

  it('builds availability request with null patToken when patPassword is empty', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    await service.validateAccess(
      makeAnalysis({ repoUrl: 'https://github.com/org/repo', branch: 'develop', commit: null }),
      '',
    );

    expect(mockGitHubAvailabilityPort.check).toHaveBeenCalledWith(
      expect.objectContaining({
        repoUrl: 'https://github.com/org/repo',
        patToken: null,
        branch: 'develop',
        commit: null,
      }),
    );
  });

  it('builds availability request with patToken when PAT flow succeeds', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockReturnValueOnce({ value: 'hashed-pat' });
    mockGitCredentialPort.authorize.mockResolvedValueOnce({
      isAuthorized: true,
      errorMessage: null,
    });
    mockPersonalAccessTokenGenerator.createPersonalAccessTokenVO.mockReturnValueOnce({
      value: 'raw-token',
    });
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    await service.validateAccess(makeAnalysis(), 'my-pat');

    expect(mockGitHubAvailabilityPort.check).toHaveBeenCalledWith(
      expect.objectContaining({ patToken: 'raw-token' }),
    );
  });

  // ─── Happy path ─────────────────────────────────────────────────────────────

  it('returns success with null patToken when patPassword is empty', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    const result = await service.validateAccess(makeAnalysis(), '');

    expect(result).toEqual(new ValidationModel(true, null, 'Access validated successfully.'));
  });

  it('returns success with patToken value when full PAT flow succeeds', async () => {
    mockPatPasswordGenerator.createPATPasswordVO.mockReturnValueOnce({ value: 'hashed-pat' });
    mockGitCredentialPort.authorize.mockResolvedValueOnce({
      isAuthorized: true,
      errorMessage: null,
    });
    mockPersonalAccessTokenGenerator.createPersonalAccessTokenVO.mockReturnValueOnce({
      value: 'raw-token',
    });
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    const result = await service.validateAccess(makeAnalysis(), 'my-pat');

    expect(result).toEqual(
      new ValidationModel(true, 'raw-token', 'Access validated successfully.'),
    );
  });

  // ─── Commit & branch passthrough ────────────────────────────────────────────

  it('passes commit hash to availability request when analysis has a commit', async () => {
    mockGitHubAvailabilityPort.check.mockResolvedValueOnce({
      isAccessible: true,
      errorMessage: null,
    });

    await service.validateAccess(makeAnalysis({ branch: null, commit: 'abc123' }), '');

    expect(mockGitHubAvailabilityPort.check).toHaveBeenCalledWith(
      expect.objectContaining({ commit: 'abc123', branch: null }),
    );
  });
});
