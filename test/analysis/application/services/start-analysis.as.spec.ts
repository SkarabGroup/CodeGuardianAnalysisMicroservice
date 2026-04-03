import { Test, TestingModule } from '@nestjs/testing';
import { StartAnalysis } from '../../../../src/analysis/application/services/start-analysis.as';
import { ANALYSIS_PROVIDER } from '../../../../src/analysis/domain/services/analysis-provider.ds';
import { GIT_CREDENTIAL_READ_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GITHUB_AVAILABILITY_PORT } from '../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';
import { StartAnalysisCommand } from '../../../../src/analysis/application/commands/start-analysis-command.command';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';

// Mock delle dipendenze
const mockAnalysisFactory = {
  createGitHubAnalysisEntity: jest.fn(),
};

const mockCredentialPort = {
  authorize: jest.fn(),
};

const mockAvailabilityPort = {
  check: jest.fn(),
};

describe('StartAnalysis Use Case - Full Coverage', () => {
  let useCase: StartAnalysis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartAnalysis,
        { provide: ANALYSIS_PROVIDER, useValue: mockAnalysisFactory },
        { provide: GIT_CREDENTIAL_READ_PORT, useValue: mockCredentialPort },
        { provide: GITHUB_AVAILABILITY_PORT, useValue: mockAvailabilityPort },
      ],
    }).compile();

    useCase = module.get<StartAnalysis>(StartAnalysis);
    jest.clearAllMocks();
  });

  // Helper per creare un'entità mockata base
  const createMockEntity = (overrides = {}) =>
    ({
      getRepoURL: () => RepoURL.create('https://github.com/user/repo'),
      getBranch: () => null,
      getCommit: () => null,
      getAnalysisId: () => ({ value: 'analysis-123' }),
      ...overrides,
    }) as unknown as GitHubAnalysis;

  // --- 1. COPERTURA FACTORY (Inizio) ---

  it('should return failure if analysis factory throws an Error instance', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'invalid' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockImplementation(() => {
      throw new Error('Factory Error');
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Factory Error');
  });
  // --- 2. COPERTURA CREDENZIALI (Blocco if command.patPassword) ---

  it('should return failure if credentials authorization is denied (isAuthorized: false)', async () => {
    const command = new StartAnalysisCommand({
      userId: 'u1',
      repositoryUrl: 'https://github.com/user/repo',
      patPassword: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: false,
      patToken: null,
      errorMessage: null,
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Authorization not granted');
  });

  it('should return failure if credentialPort returns an errorMessage', async () => {
    const command = new StartAnalysisCommand({
      userId: 'u1',
      repositoryUrl: 'url',
      patPassword: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: true,
      patToken: 'token',
      errorMessage: 'Service Unavailable',
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Authorization not granted');
  });

  it('should return failure if patToken is missing in credentialResponse', async () => {
    const command = new StartAnalysisCommand({
      userId: 'u1',
      repositoryUrl: 'url',
      patPassword: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: true,
      patToken: null, // Manca il token nonostante isAuthorized sia true
      errorMessage: null,
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Authorization not granted');
  });

  it('should return failure if credentialPort.authorize throws an error', async () => {
    const command = new StartAnalysisCommand({
      userId: 'u1',
      repositoryUrl: 'url',
      patPassword: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());
    mockCredentialPort.authorize.mockRejectedValue(new Error('DB Error'));

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('DB Error');
  });

  // --- 3. COPERTURA DISPONIBILITÀ (GitHub Port) ---

  it('should return failure if availabilityPort.check returns isAccessible: false', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'url' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: false,
      errorMessage: 'Repo Private or Not Found',
      commit: null,
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Repo Private or Not Found');
  });

  it('should return default message if isAccessible: false and no errorMessage provided', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'url' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: false,
      errorMessage: null,
      commit: null,
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('GitHub repository not accessible');
  });

  it('should return failure if availabilityPort.check throws an error', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'url' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    const errorMessage = 'Network Timeout';
    mockAvailabilityPort.check.mockRejectedValue(new Error(errorMessage));

    const result = await useCase.execute(command);

    expect(result.isSuccess).toBe(false);
    // Cambia l'aspettativa per riflettere il comportamento del codice
    expect(result.error).toBe(errorMessage);
  });

  // --- 4. CASI DI SUCCESSO (Finali) ---

  it('should return success with commit SHA if resolved by GitHub', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'url' });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      commit: 'resolved-sha-456',
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(true);
    expect(result.analysisId).toBe('resolved-sha-456');
  });

  it('should return success with analysisId if no commit SHA is resolved', async () => {
    const command = new StartAnalysisCommand({ userId: 'u1', repositoryUrl: 'url' });
    const mockEntity = createMockEntity({
      getAnalysisId: () => ({ value: 'uuid-789' }),
    });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(mockEntity);

    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      commit: null, // Nessuno SHA restituito (caso raro o branch vuoto)
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(true);
    expect(result.analysisId).toBe('uuid-789');
  });

  it('should correctly handle successful flow with patPassword', async () => {
    const command = new StartAnalysisCommand({
      userId: 'u1',
      repositoryUrl: 'https://github.com/owner/repo',
      patPassword: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    mockAnalysisFactory.createGitHubAnalysisEntity.mockReturnValue(createMockEntity());

    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: true,
      patToken: 'ghp_' + 'A'.repeat(36),
      errorMessage: null,
    });

    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      commit: 'final-sha',
    });

    const result = await useCase.execute(command);
    expect(result.isSuccess).toBe(true);
    expect(mockCredentialPort.authorize).toHaveBeenCalled();
    expect(result.analysisId).toBe('final-sha');
  });
});
