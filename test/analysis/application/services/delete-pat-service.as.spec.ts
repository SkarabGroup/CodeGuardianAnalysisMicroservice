import { Test, TestingModule } from '@nestjs/testing';
import { DeletePatService } from '../../../../src/analysis/application/services/delete-pat-service.as';
import { DeletePatCommand } from '../../../../src/analysis/application/commands/delete-pat-command.command';
import { GIT_CREDENTIAL_DELETE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';
import { PASSWORD_PROVIDER } from '../../../../src/analysis/domain/services/pat-password-provider.ds';
import { DeleteGitCredentialRequest } from '../../../../src/analysis/application/DTOs/models/requests/delete-git-credential-request.model';

jest.mock('../../../../src/analysis/domain/value-objects/repo-url.vo');

const mockRepoURL = { value: 'https://github.com/org/repo' };
const repoURLCreateSpy = jest
  .spyOn(RepoURL, 'create')
  .mockReturnValue(mockRepoURL as ReturnType<typeof RepoURL.create>);

describe('DeletePatService', () => {
  let service: DeletePatService;
  let deletePATMock: jest.Mock<
    Promise<{ isSuccess: boolean; errorMessage?: string }>,
    [DeleteGitCredentialRequest]
  >;
  let generateMock: jest.Mock<PATPassword, [string]>;

  const validCommand = new DeletePatCommand({
    repositoryUrl: 'https://github.com/org/repo',
    patPassword: 'my-secret-password',
  });

  const mockHashedPassword = { value: 'hashed-password-123' } as PATPassword;

  beforeEach(async () => {
    deletePATMock = jest.fn<
      Promise<{ isSuccess: boolean; errorMessage?: string }>,
      [DeleteGitCredentialRequest]
    >();
    generateMock = jest.fn<PATPassword, [string]>().mockReturnValue(mockHashedPassword);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePatService,
        {
          provide: GIT_CREDENTIAL_DELETE_PORT,
          useValue: { deletePAT: deletePATMock },
        },
        {
          provide: PASSWORD_PROVIDER,
          useValue: { generate: generateMock },
        },
      ],
    }).compile();

    service = module.get<DeletePatService>(DeletePatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('when the port returns success', () => {
      it('should return a successful DeletePatResult', async () => {
        deletePATMock.mockResolvedValue({ isSuccess: true });

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should call deletePAT with a request built from the command and the password provider', async () => {
        deletePATMock.mockResolvedValue({ isSuccess: true });

        await service.execute(validCommand);

        expect(repoURLCreateSpy).toHaveBeenCalledWith(validCommand.repositoryUrl);
        expect(generateMock).toHaveBeenCalledWith(validCommand.patPassword);

        const deleteCallArg = deletePATMock.mock.calls[0][0];
        expect(deleteCallArg.repoUrl).toBe(mockRepoURL);
        expect(deleteCallArg.patPassword).toBe(mockHashedPassword);
      });
    });

    describe('when the port returns failure', () => {
      it('should return a failed result with the port error message', async () => {
        deletePATMock.mockResolvedValue({
          isSuccess: false,
          errorMessage: 'Credential not found',
        });

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Credential not found');
      });

      it('should fall back to a generic message when errorMessage is missing', async () => {
        deletePATMock.mockResolvedValue({ isSuccess: false });

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Unknown error occurred while deleting Git credentials');
      });
    });

    describe('when the port throws', () => {
      it('should catch an Error instance and return a failed result with its message', async () => {
        deletePATMock.mockRejectedValue(new Error('Connection timeout'));

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Failed to delete Git credentials: Connection timeout');
      });

      it('should catch a non-Error thrown value and stringify it', async () => {
        deletePATMock.mockRejectedValue('unexpected string error');

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe(
          'Failed to delete Git credentials: unexpected string error',
        );
      });
    });
  });
});
