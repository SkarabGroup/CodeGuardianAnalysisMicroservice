import { Test, TestingModule } from '@nestjs/testing';
import { GitAuthorizerService } from '../../../../src/analysis/application/services/git-authorizer-service.as';
import { GIT_CREDENTIAL_READ_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { ConfigurationService } from '../../../../src/analysis/infrastructure/configuration/configuration.service';

import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';

describe('GitAuthorizerService', () => {
  let service: GitAuthorizerService;

  const mockCredentialPort = {
    authorize: jest.fn(),
  };

  // Definiamo un'interfaccia per il mock per evitare il casting ad any
  interface MockConfig {
    codeGuardianToken: string;
  }

  const mockConfigurationService: MockConfig = {
    codeGuardianToken: 'ghp_' + 'A'.repeat(36),
  };

  const validUrl = RepoURL.create('https://github.com/owner/repo');
  const validPassword = PATPassword.create(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
  // Salviamo il token originale per i ripristini
  const originalToken = mockConfigurationService.codeGuardianToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitAuthorizerService,
        { provide: GIT_CREDENTIAL_READ_PORT, useValue: mockCredentialPort },
        { provide: ConfigurationService, useValue: mockConfigurationService },
      ],
    }).compile();

    service = module.get<GitAuthorizerService>(GitAuthorizerService);
    jest.resetAllMocks();

    // Assicuriamoci che il token sia resettato prima di ogni test
    mockConfigurationService.codeGuardianToken = originalToken;
  });

  describe('Private Strategy', () => {
    it('should return PAT when authorization succeeds', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: true,
        patToken: originalToken,
        errorMessage: null,
      });

      const result = await service.authorize(validUrl, validPassword);

      expect(result).toBeInstanceOf(PersonalAccessToken);
      expect(result.value).toBe(originalToken);
      expect(mockCredentialPort.authorize).toHaveBeenCalledTimes(1);
    });

    it('should throw if URL is missing for private authorization (line 29 coverage)', async () => {
      // Forziamo il bypass di TS per passare undefined dove è richiesto RepoURL
      await expect(
        service.authorize(undefined as unknown as RepoURL, validPassword),
      ).rejects.toThrow('URL is required for private repository authorization');
    });

    it('should throw if response is not authorized or token is missing (line 36 coverage)', async () => {
      // Caso 1: isAuthorized false
      mockCredentialPort.authorize.mockResolvedValueOnce({
        isAuthorized: false,
        patToken: null,
        errorMessage: null,
      });

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Authorization not granted',
      );

      // Caso 2: isAuthorized true ma token mancante (edge case logico)
      mockCredentialPort.authorize.mockResolvedValueOnce({
        isAuthorized: true,
        patToken: null,
        errorMessage: null,
      });

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Authorization not granted',
      );
    });

    it('should throw with specific error message from port if present (line 36 coverage)', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: false,
        patToken: null,
        errorMessage: 'Invalid database connection',
      });

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Invalid database connection',
      );
    });
  });

  describe('Public Strategy', () => {
    it('should return token from ConfigurationService', async () => {
      const result = await service.authorize(validUrl);

      expect(result.value).toBe(originalToken);
      expect(mockCredentialPort.authorize).not.toHaveBeenCalled();
    });

    it('should throw if token is invalid for Value Object', async () => {
      // Modifica sicura senza 'any': mockConfigurationService implementa MockConfig
      mockConfigurationService.codeGuardianToken = 'invalid-token';

      await expect(service.authorize(validUrl)).rejects.toThrow();
    });
  });

  describe('Strategy Switching', () => {
    it('should use PrivateStrategy when password is provided', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: true,
        patToken: originalToken,
      });

      await service.authorize(validUrl, validPassword);

      expect(mockCredentialPort.authorize).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    it('should instantiate correctly', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(GitAuthorizerService);
    });
  });
});
