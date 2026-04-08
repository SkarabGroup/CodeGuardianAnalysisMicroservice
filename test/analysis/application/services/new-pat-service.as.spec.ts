import { Test, TestingModule } from '@nestjs/testing';
import { NewPatService } from '../../../../src/analysis/application/services/new-pat-service.as';
import { NewPatCommand } from '../../../../src/analysis/application/commands/new-pat-command.command';
import { PostGitCredentialResponse } from '../../../../src/analysis/application/DTOs/models/responses/post-git-credential-result.model';
import { PASSWORD_PROVIDER } from '../../../../src/analysis/domain/services/pat-password-provider.ds';
import { GIT_CREDENTIAL_SAVE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';
import { NewPatResult } from '../../../../src/analysis/application/results/new-pat-result.result';

import type { IPasswordProvider } from '../../../../src/analysis/domain/services/interfaces/password-provider.ds.interface';
import type { IGitCredentialSavePort } from '../../../../src/analysis/application/ports/repositories/git-save-credential-port.repository';

describe('NewPatService (Unit Test)', () => {
  let service: NewPatService;

  const mockSavePort: jest.Mocked<IGitCredentialSavePort> = {
    save: jest.fn(),
  };

  const mockPasswordProvider: jest.Mocked<IPasswordProvider> = {
    generate: jest.fn(),
  };

  const VALID_REPO_URL = 'https://github.com/owner/repo';
  const VALID_PASSWORD = 'ValidPassword123!';
  const HASHED_PASSWORD = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const VALID_PAT = 'ghp_' + 'A'.repeat(36);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewPatService,
        { provide: GIT_CREDENTIAL_SAVE_PORT, useValue: mockSavePort },
        { provide: PASSWORD_PROVIDER, useValue: mockPasswordProvider },
      ],
    }).compile();

    service = module.get<NewPatService>(NewPatService);
    jest.clearAllMocks();
  });

  const makeCommand = (
    overrides: Partial<ConstructorParameters<typeof NewPatCommand>[0]> = {},
  ): NewPatCommand => {
    return new NewPatCommand({
      repositoryUrl: VALID_REPO_URL,
      patPassword: VALID_PASSWORD,
      personalAccessToken: VALID_PAT,
      ...overrides,
    });
  };

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(NewPatService);
    });
  });

  describe('execute', () => {
    describe('success path', () => {
      it('should return success when the port saves correctly', async () => {
        mockPasswordProvider.generate.mockReturnValue(PATPassword.create(HASHED_PASSWORD));
        mockSavePort.save.mockResolvedValue(PostGitCredentialResponse.success());

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(true);
        expect(result).toBeInstanceOf(NewPatResult);
      });

      it('should forward repoUrl, hashed password and PAT to the port', async () => {
        mockPasswordProvider.generate.mockReturnValue(PATPassword.create(HASHED_PASSWORD));
        mockSavePort.save.mockResolvedValue(PostGitCredentialResponse.success());

        await service.execute(makeCommand());

        const request = mockSavePort.save.mock.calls[0][0];

        expect(request.repoUrl.value).toBe(VALID_REPO_URL);
        expect(request.password.value).toBe(HASHED_PASSWORD);
        expect(request.pat.value).toBe(VALID_PAT);
      });
    });

    describe('failure path — port returns failure', () => {
      it('should return failure when the port returns isSuccess false', async () => {
        mockPasswordProvider.generate.mockReturnValue(PATPassword.create(HASHED_PASSWORD));
        mockSavePort.save.mockResolvedValue(
          PostGitCredentialResponse.failure('Credentials already exist'),
        );

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Credentials already exist');
      });

      it('should use a fallback message when the port returns failure with no message', async () => {
        mockPasswordProvider.generate.mockReturnValue(PATPassword.create(HASHED_PASSWORD));
        mockSavePort.save.mockResolvedValue(new PostGitCredentialResponse(false, ''));

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Unknown error occurred while saving Git credentials');
      });
    });

    describe('failure path — execution throws', () => {
      it('should return failure when the password provider throws', async () => {
        const error = new Error('Validation failed');
        mockPasswordProvider.generate.mockImplementation(() => {
          throw error;
        });

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toContain('Validation failed');
      });

      it('should return failure when the port throws an Error', async () => {
        mockPasswordProvider.generate.mockReturnValue(PATPassword.create(HASHED_PASSWORD));
        mockSavePort.save.mockRejectedValue(new Error('DB unreachable'));

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toContain('Failed to save Git credentials: DB unreachable');
      });

      it('should handle non-Error throws by stringifying them', async () => {
        mockPasswordProvider.generate.mockReturnValue(PATPassword.create(HASHED_PASSWORD));
        mockSavePort.save.mockRejectedValue('unexpected string error');

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toContain('unexpected string error');
      });

      it('should handle thrown objects that are not Error instances', async () => {
        mockPasswordProvider.generate.mockReturnValue(PATPassword.create(HASHED_PASSWORD));
        mockSavePort.save.mockRejectedValue({ code: 503 });

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toContain('Failed to save Git credentials: [object Object]');
      });
    });
  });
});
