import { Test, TestingModule } from '@nestjs/testing';
import { GitAccessService } from '../../../../src/analysis/application/services/git-access-service.as';
import { GIT_CREDENTIAL_READ_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';

const mockCredentialPort = {
  authorize: jest.fn(),
};

describe('GitAccessService Application Service', () => {
  let service: GitAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitAccessService,
        { provide: GIT_CREDENTIAL_READ_PORT, useValue: mockCredentialPort },
      ],
    }).compile();

    service = module.get<GitAccessService>(GitAccessService);
    jest.clearAllMocks();
  });

  const validUrl = RepoURL.create('https://github.com/owner/repo');
  const validPassword = PATPassword.create(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );

  it('should return a PersonalAccessToken if authorization is successful', async () => {
    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: true,
      patToken: 'ghp_' + 'A'.repeat(36),
      errorMessage: null,
    });

    const result = await service.authorize(validUrl, validPassword);

    expect(result.value).toBe('ghp_' + 'A'.repeat(36));
  });

  it('should throw an error if isAuthorized is false', async () => {
    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: false,
      patToken: null,
      errorMessage: null,
    });

    await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
      'Authorization not granted',
    );
  });

  it('should throw an error if an errorMessage is provided', async () => {
    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: false,
      patToken: null,
      errorMessage: 'Service Unavailable',
    });

    await expect(service.authorize(validUrl, validPassword)).rejects.toThrow('Service Unavailable');
  });

  it('should throw an error if patToken is missing', async () => {
    mockCredentialPort.authorize.mockResolvedValue({
      isAuthorized: true,
      patToken: null,
      errorMessage: null,
    });

    await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
      'Authorization not granted',
    );
  });

  it('should propagate errors thrown by the port', async () => {
    mockCredentialPort.authorize.mockRejectedValue(new Error('DB Error'));

    await expect(service.authorize(validUrl, validPassword)).rejects.toThrow('DB Error');
  });
});
