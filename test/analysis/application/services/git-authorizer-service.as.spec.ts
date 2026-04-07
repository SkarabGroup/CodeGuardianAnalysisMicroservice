import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GitAuthorizerService } from '../../../../src/analysis/application/services/git-authorizer-service.as';
import { GIT_CREDENTIAL_READ_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';

const mockCredentialPort = {
  authorize: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('GitAuthorizerService Arricchito', () => {
  let service: GitAuthorizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitAuthorizerService,
        { provide: GIT_CREDENTIAL_READ_PORT, useValue: mockCredentialPort },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GitAuthorizerService>(GitAuthorizerService);
    jest.clearAllMocks();
  });

  const validUrl = RepoURL.create('https://github.com/owner/repo');
  const validPassword = PATPassword.create(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
  const validPatString = 'ghp_' + 'A'.repeat(36);

  // --- TEST STRATEGIA PRIVATA ---
  describe('Private Strategy Execution', () => {
    it('should return a PersonalAccessToken if authorization is successful', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: true,
        patToken: validPatString,
        errorMessage: null,
      });

      const result = await service.authorize(validUrl, validPassword);

      expect(result).toBeInstanceOf(PersonalAccessToken);
      expect(result.value).toBe(validPatString);
      expect(mockCredentialPort.authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          repoUrl: validUrl,
          password: validPassword,
        }),
      );
    });

    it('should throw Error if isAuthorized is false', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: false,
        patToken: null,
        errorMessage: null,
      });

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Authorization not granted',
      );
    });

    it('should throw Error if an errorMessage is returned from port', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: false,
        patToken: null,
        errorMessage: 'Database connection failed',
      });

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should throw Error if port returns an unexpected empty response', async () => {
      mockCredentialPort.authorize.mockResolvedValue({});

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Authorization not granted',
      );
    });
  });

  // --- TEST STRATEGIA PUBBLICA ---
  describe('Public Strategy Execution', () => {
    it('should return token from config even if URL is provided (Public Strategy context)', async () => {
      mockConfigService.get.mockReturnValue(validPatString);

      const result = await service.authorize(validUrl);

      expect(result.value).toBe(validPatString);
      expect(mockConfigService.get).toHaveBeenCalledWith('CODE_GUARDIAN_TOKEN');
      expect(mockCredentialPort.authorize).not.toHaveBeenCalled();
    });

    it('should throw error if public token is not configured in env', async () => {
      mockConfigService.get.mockReturnValue(null);

      await expect(service.authorize(validUrl)).rejects.toThrow(
        'Public analysis requested but GITHUB_PUBLIC_TOKEN is not configured',
      );
    });
  });

  // --- TEST SCELTA DELLA STRATEGIA (Switch Logic) ---
  describe('Strategy Switching Logic', () => {
    it('should use PrivateStrategy when password is provided', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: true,
        patToken: validPatString,
      });

      await service.authorize(validUrl, validPassword);

      expect(mockCredentialPort.authorize).toHaveBeenCalled();
      expect(mockConfigService.get).not.toHaveBeenCalled();
    });

    it('should use PublicStrategy when password is not provided', async () => {
      mockConfigService.get.mockReturnValue(validPatString);

      await service.authorize(validUrl);

      expect(mockConfigService.get).toHaveBeenCalled();
      expect(mockCredentialPort.authorize).not.toHaveBeenCalled();
    });
  });

  // --- TEST COMPLEMENTARI E ROBUSTEZZA ---
  describe('Edge Cases and Integrity', () => {
    it('should propagate errors thrown by the port', async () => {
      mockCredentialPort.authorize.mockRejectedValue(new Error('Port crash'));

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow('Port crash');
    });

    it('should throw error if the returned token format is invalid for VO PersonalAccessToken', async () => {
      mockConfigService.get.mockReturnValue('invalid-token');

      await expect(service.authorize(validUrl)).rejects.toThrow();
    });
  });

  // --- TEST RUNTIME CHECKS ---
  describe('Runtime Validation', () => {
    it('should throw specific error for missing URL in private context', async () => {
      // @ts-ignore (testiamo runtime bypassando i controlli TS)
      await expect(service.authorize(undefined, validPassword)).rejects.toThrow(
        'URL is required for private repository authorization',
      );
    });
  });

  describe('GitAuthorizerService Constructor', () => {
    it('should be defined and correctly instantiated', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GitAuthorizerService,
          { provide: GIT_CREDENTIAL_READ_PORT, useValue: mockCredentialPort },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const instance = module.get<GitAuthorizerService>(GitAuthorizerService);

      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(GitAuthorizerService);
    });
  });
});
