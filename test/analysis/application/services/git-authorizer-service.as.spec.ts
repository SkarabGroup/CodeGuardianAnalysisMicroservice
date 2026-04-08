import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { GitAuthorizerService } from '../../../../src/analysis/application/services/git-authorizer-service.as';
import { GIT_CREDENTIAL_READ_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';

import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';

describe('GitAuthorizerService', () => {
  let service: GitAuthorizerService;

  const mockCredentialPort = {
    authorize: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const validUrl = RepoURL.create('https://github.com/owner/repo');
  const validPassword = PATPassword.create(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
  const validPatString = 'ghp_' + 'A'.repeat(36);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitAuthorizerService,
        { provide: GIT_CREDENTIAL_READ_PORT, useValue: mockCredentialPort },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GitAuthorizerService>(GitAuthorizerService);

    jest.resetAllMocks();
  });

  describe('Private Strategy', () => {
    it('should return PAT when authorization succeeds', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: true,
        patToken: validPatString,
        errorMessage: null,
      });

      const result = await service.authorize(validUrl, validPassword);

      expect(result).toBeInstanceOf(PersonalAccessToken);
      expect(result.value).toBe(validPatString);

      expect(mockCredentialPort.authorize).toHaveBeenCalledTimes(1);
    });

    it('should throw if isAuthorized is false', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: false,
        patToken: null,
        errorMessage: null,
      });

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Authorization not granted',
      );
    });

    it('should throw if errorMessage is present', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: false,
        patToken: null,
        errorMessage: 'DB error',
      });

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow('DB error');
    });

    it('should throw if response is malformed', async () => {
      mockCredentialPort.authorize.mockResolvedValue({});

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow(
        'Authorization not granted',
      );
    });

    it('should propagate port errors', async () => {
      mockCredentialPort.authorize.mockRejectedValue(new Error('Port failure'));

      await expect(service.authorize(validUrl, validPassword)).rejects.toThrow('Port failure');
    });

    it('should throw if URL is missing', async () => {
      // bypass TS
      await expect(
        service.authorize(undefined as unknown as RepoURL, validPassword),
      ).rejects.toThrow('URL is required for private repository authorization');
    });
  });

  describe('Public Strategy', () => {
    it('should return token from config', async () => {
      mockConfigService.get.mockReturnValue(validPatString);

      const result = await service.authorize(validUrl);

      expect(result.value).toBe(validPatString);
      expect(mockConfigService.get).toHaveBeenCalledWith('CODE_GUARDIAN_TOKEN');
      expect(mockCredentialPort.authorize).not.toHaveBeenCalled();
    });

    it('should throw if token not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.authorize(validUrl)).rejects.toThrow(
        'Public analysis requested but GITHUB_PUBLIC_TOKEN is not configured',
      );
    });

    it('should throw if token is invalid for VO', async () => {
      mockConfigService.get.mockReturnValue('invalid-token');

      await expect(service.authorize(validUrl)).rejects.toThrow();
    });
  });

  describe('Strategy Switching', () => {
    it('should use PrivateStrategy when password is provided', async () => {
      mockCredentialPort.authorize.mockResolvedValue({
        isAuthorized: true,
        patToken: validPatString,
      });

      await service.authorize(validUrl, validPassword);

      expect(mockCredentialPort.authorize).toHaveBeenCalled();
      expect(mockConfigService.get).not.toHaveBeenCalled();
    });

    it('should use PublicStrategy when password is NOT provided', async () => {
      mockConfigService.get.mockReturnValue(validPatString);

      await service.authorize(validUrl);

      expect(mockConfigService.get).toHaveBeenCalled();
      expect(mockCredentialPort.authorize).not.toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    it('should instantiate correctly', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(GitAuthorizerService);
    });
  });
});
