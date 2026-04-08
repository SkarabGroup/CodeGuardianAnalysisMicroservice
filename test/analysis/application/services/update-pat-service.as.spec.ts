import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePatService } from '../../../../src/analysis/application/services/update-pat-service.as';
import { UpdatePatCommand } from '../../../../src/analysis/application/commands/update-pat-command.command';
import { UpdateGitCredentialPatResponse } from '../../../../src/analysis/application/DTOs/models/responses/update-git-credential-pat-response.model';
import { GIT_CREDENTIAL_UPDATE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';
import { PASSWORD_PROVIDER } from '../../../../src/analysis/domain/services/pat-password-provider.ds';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';
import { UpdateGitCredentialPatRequest } from '../../../../src/analysis/application/DTOs/models/requests/update-git-credential-pat-request.model';

jest.mock('../../../../src/analysis/domain/value-objects/repo-url.vo');
jest.mock('../../../../src/analysis/domain/value-objects/personal-access-token.vo');

const mockRepoURL = { value: 'https://github.com/org/repo' };
const repoURLCreateSpy = jest
  .spyOn(RepoURL, 'create')
  .mockReturnValue(mockRepoURL as ReturnType<typeof RepoURL.create>);

const mockNewPat = { value: 'ghp_newtoken' };
const personalAccessTokenCreateSpy = jest
  .spyOn(PersonalAccessToken, 'create')
  .mockReturnValue(mockNewPat as ReturnType<typeof PersonalAccessToken.create>);

describe('UpdatePatService', () => {
  let service: UpdatePatService;
  let updatePATMock: jest.Mock<
    Promise<UpdateGitCredentialPatResponse | { isSuccess: boolean; errorMessage?: string }>,
    [UpdateGitCredentialPatRequest]
  >;
  let generateMock: jest.Mock<PATPassword, [string]>;

  const validCommand = new UpdatePatCommand({
    repositoryUrl: 'https://github.com/org/repo',
    patPassword: 'my-secret-password',
    newPat: 'ghp_newtoken',
  });

  const mockHashedPassword = { value: 'hashed-password-123' } as PATPassword;

  beforeEach(async () => {
    updatePATMock = jest.fn<
      Promise<UpdateGitCredentialPatResponse | { isSuccess: boolean; errorMessage?: string }>,
      [UpdateGitCredentialPatRequest]
    >();
    generateMock = jest.fn<PATPassword, [string]>().mockReturnValue(mockHashedPassword);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePatService,
        {
          provide: GIT_CREDENTIAL_UPDATE_PORT,
          useValue: { updatePAT: updatePATMock },
        },
        {
          provide: PASSWORD_PROVIDER,
          useValue: { generate: generateMock },
        },
      ],
    }).compile();

    service = module.get<UpdatePatService>(UpdatePatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('when the port returns success', () => {
      it('should return a successful UpdatePatResult', async () => {
        updatePATMock.mockResolvedValue(UpdateGitCredentialPatResponse.success());

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should build the request from all command fields and the password provider', async () => {
        updatePATMock.mockResolvedValue(UpdateGitCredentialPatResponse.success());

        await service.execute(validCommand);

        expect(repoURLCreateSpy).toHaveBeenCalledWith(validCommand.repositoryUrl);
        expect(generateMock).toHaveBeenCalledWith(validCommand.patPassword);
        expect(personalAccessTokenCreateSpy).toHaveBeenCalledWith(validCommand.newPat);

        const updateCallArg = updatePATMock.mock.calls[0][0];
        expect(updateCallArg.repoUrl).toBe(mockRepoURL);
        expect(updateCallArg.patPassword).toBe(mockHashedPassword);
        expect(updateCallArg.newPat).toBe(mockNewPat);
      });
    });

    describe('when the port returns failure', () => {
      it('should return a failed result with the port error message', async () => {
        updatePATMock.mockResolvedValue(
          UpdateGitCredentialPatResponse.failure('Credential not found'),
        );

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Credential not found');
      });

      it('should fall back to a generic message when errorMessage is missing', async () => {
        updatePATMock.mockResolvedValue(new UpdateGitCredentialPatResponse(false, ''));

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Unknown error occurred while updating Git credentials');
      });
    });

    describe('when the port throws', () => {
      it('should catch an Error instance and return a failed result with its message', async () => {
        updatePATMock.mockRejectedValue(new Error('Connection timeout'));

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Failed to update Git credentials: Connection timeout');
      });

      it('should catch a non-Error thrown value and stringify it', async () => {
        updatePATMock.mockRejectedValue('unexpected string error');

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe(
          'Failed to update Git credentials: unexpected string error',
        );
      });
    });
  });
});
