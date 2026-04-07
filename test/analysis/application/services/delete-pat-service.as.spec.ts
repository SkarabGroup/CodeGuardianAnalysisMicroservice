import { Test, TestingModule } from '@nestjs/testing';
import { DeletePatService } from '../../../../src/analysis/application/services/delete-pat-service.as';
import { IGitCredentialDeletePort } from '../../../../src/analysis/application/ports/repositories/git-delete-credential-port.repository';
import { DeletePatCommand } from '../../../../src/analysis/application/commands/delete-pat-command.command';
import { GIT_CREDENTIAL_DELETE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';

// Mock value objects
jest.mock('../../../../src/analysis/domain/value-objects/repo-url.vo');
jest.mock('../../../../src/analysis/domain/value-objects/pat-password.vo');

const mockRepoURL = { value: 'https://github.com/org/repo' };
const mockPATPassword = { value: 'ghp_testtoken' };

const repoURLCreateSpy = jest
  .spyOn(RepoURL, 'create')
  .mockReturnValue(mockRepoURL as ReturnType<typeof RepoURL.create>);
const patPasswordCreateSpy = jest
  .spyOn(PATPassword, 'create')
  .mockReturnValue(mockPATPassword as ReturnType<typeof PATPassword.create>);

describe('DeletePatService', () => {
  let service: DeletePatService;
  let credentialPort: jest.Mocked<IGitCredentialDeletePort>;

  const validCommand = new DeletePatCommand({
    repositoryUrl: 'https://github.com/org/repo',
    patPassword: 'ghp_testtoken',
  });

  beforeEach(async () => {
    const mockCredentialPort: jest.Mocked<IGitCredentialDeletePort> = {
      deletePAT: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePatService,
        {
          provide: GIT_CREDENTIAL_DELETE_PORT,
          useValue: mockCredentialPort,
        },
      ],
    }).compile();

    service = module.get<DeletePatService>(DeletePatService);
    credentialPort = module.get(GIT_CREDENTIAL_DELETE_PORT);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── execute ────────────────────────────────────────────────────────────────

  describe('execute', () => {
    describe('when the port returns success', () => {
      it('should return a successful DeletePatResult', async () => {
        credentialPort.deletePAT.mockResolvedValue({ isSuccess: true });

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should call deletePAT with a request built from the command', async () => {
        credentialPort.deletePAT.mockResolvedValue({ isSuccess: true });

        await service.execute(validCommand);

        expect(repoURLCreateSpy).toHaveBeenCalledWith(validCommand.repositoryUrl);
        expect(patPasswordCreateSpy).toHaveBeenCalledWith(validCommand.patPassword);
        expect(credentialPort.deletePAT.mock.calls).toHaveLength(1);
      });
    });

    describe('when the port returns failure', () => {
      it('should return a failed result with the port error message', async () => {
        credentialPort.deletePAT.mockResolvedValue({
          isSuccess: false,
          errorMessage: 'Credential not found',
        });

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Credential not found');
      });

      it('should fall back to a generic message when errorMessage is missing', async () => {
        credentialPort.deletePAT.mockResolvedValue({ isSuccess: false });

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Unknown error occurred while deleting Git credentials');
      });
    });

    describe('when the port throws', () => {
      it('should catch an Error instance and return a failed result with its message', async () => {
        credentialPort.deletePAT.mockRejectedValue(new Error('Connection timeout'));

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Failed to delete Git credentials: Connection timeout');
      });

      it('should catch a non-Error thrown value and stringify it', async () => {
        credentialPort.deletePAT.mockRejectedValue('unexpected string error');

        const result = await service.execute(validCommand);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe(
          'Failed to delete Git credentials: unexpected string error',
        );
      });
    });
  });
});
