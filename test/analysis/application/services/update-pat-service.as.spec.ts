import { Test, TestingModule } from '@nestjs/testing';

import { UpdatePatService } from '../../../../src/analysis/application/services/update-pat-service.as';
import { IGitCredentialUpdatePort } from '../../../../src/analysis/application/ports/repositories/git-update-credential-port.repository';
import { UpdatePatCommand } from '../../../../src/analysis/application/commands/update-pat-command.command';
import { UpdateGitCredentialPatResponse } from '../../../../src/analysis/application/DTOs/models/responses/update-git-credential-pat-response.model';
import { GIT_CREDENTIAL_UPDATE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';

jest.mock('../../../../src/analysis/domain/value-objects/repo-url.vo');
jest.mock('../../../../src/analysis/domain/value-objects/pat-password.vo');
jest.mock('../../../../src/analysis/domain/value-objects/personal-access-token.vo');

const repoURLCreateSpy = jest
  .spyOn(RepoURL, 'create')
  .mockReturnValue({ value: 'https://github.com/org/repo' } as ReturnType<typeof RepoURL.create>);
const patPasswordCreateSpy = jest
  .spyOn(PATPassword, 'create')
  .mockReturnValue({ value: 'ghp_oldtoken' } as ReturnType<typeof PATPassword.create>);
const personalAccessTokenCreateSpy = jest
  .spyOn(PersonalAccessToken, 'create')
  .mockReturnValue({ value: 'ghp_newtoken' } as ReturnType<typeof PersonalAccessToken.create>);

describe('UpdatePatService', () => {
  let service: UpdatePatService;
  let credentialPort: jest.Mocked<IGitCredentialUpdatePort>;

  const validCommand = new UpdatePatCommand({
    repositoryUrl: 'https://github.com/org/repo',
    patPassword: 'ghp_oldtoken',
    newPat: 'ghp_newtoken',
  });

  beforeEach(async () => {
    const mockCredentialPort: jest.Mocked<IGitCredentialUpdatePort> = {
      updatePAT: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePatService,
        {
          provide: GIT_CREDENTIAL_UPDATE_PORT,
          useValue: mockCredentialPort,
        },
      ],
    }).compile();

    service = module.get<UpdatePatService>(UpdatePatService);
    credentialPort = module.get<jest.Mocked<IGitCredentialUpdatePort>>(GIT_CREDENTIAL_UPDATE_PORT);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── execute ────────────────────────────────────────────────────────────────

  describe('execute', () => {
    describe('when the port returns success', () => {
      it('should return a successful UpdatePatResult', async () => {
        credentialPort.updatePAT.mockResolvedValue(UpdateGitCredentialPatResponse.success());

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should build the request from all three command fields', async () => {
        credentialPort.updatePAT.mockResolvedValue(UpdateGitCredentialPatResponse.success());

        await service.execute(validCommand);

        expect(repoURLCreateSpy).toHaveBeenCalledWith(validCommand.repositoryUrl);
        expect(patPasswordCreateSpy).toHaveBeenCalledWith(validCommand.patPassword);
        expect(personalAccessTokenCreateSpy).toHaveBeenCalledWith(validCommand.newPat);
        expect(credentialPort.updatePAT.mock.calls).toHaveLength(1);
      });
    });

    describe('when the port returns failure', () => {
      it('should return a failed result with the port error message', async () => {
        credentialPort.updatePAT.mockResolvedValue(
          UpdateGitCredentialPatResponse.failure('Credential not found'),
        );

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Credential not found');
      });

      it('should fall back to a generic message when errorMessage is missing', async () => {
        credentialPort.updatePAT.mockResolvedValue(new UpdateGitCredentialPatResponse(false, ''));

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Unknown error occurred while deleting Git credentials');
      });
    });

    describe('when the port throws', () => {
      it('should catch an Error instance and return a failed result with its message', async () => {
        credentialPort.updatePAT.mockRejectedValue(new Error('Connection timeout'));

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Failed to update Git credentials: Connection timeout');
      });

      it('should catch a non-Error thrown value and stringify it', async () => {
        credentialPort.updatePAT.mockRejectedValue('unexpected string error');

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe(
          'Failed to update Git credentials: unexpected string error',
        );
      });
    });
  });
});
