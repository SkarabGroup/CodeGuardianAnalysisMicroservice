import { NewPatService } from '../../../../src/analysis/application/services/new-pat-service.as';
import { IGitCredentialSavePort } from '../../../../src/analysis/application/ports/repositories/git-save-credential-port.repository';
import { NewPatCommand } from '../../../../src/analysis/application/commands/new-pat-command.command';
import { PostGitCredentialResponse } from '../../../../src/analysis/application/DTOs/models/responses/post-git-credential-result.model';

const VALID_REPO_URL = 'https://github.com/owner/repo';
const VALID_PASSWORD = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const VALID_PAT = 'ghp_' + 'A'.repeat(36);

const makeCommand = (overrides: Partial<NewPatCommand> = {}): NewPatCommand => ({
  repositoryUrl: VALID_REPO_URL,
  patPassword: VALID_PASSWORD,
  personalAccessToken: VALID_PAT,
  ...overrides,
});

describe('NewPatService (Unit Test)', () => {
  let service: NewPatService;
  let mockSavePort: jest.Mocked<IGitCredentialSavePort>;

  beforeEach(() => {
    mockSavePort = {
      save: jest.fn(),
    };
    service = new NewPatService(mockSavePort);
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(NewPatService);
    });
  });

  describe('execute', () => {
    describe('success path', () => {
      it('should return success when the port saves correctly', async () => {
        mockSavePort.save.mockResolvedValue(PostGitCredentialResponse.success());

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should forward repoUrl, password and PAT to the port', async () => {
        mockSavePort.save.mockResolvedValue(PostGitCredentialResponse.success());

        await service.execute(makeCommand());

        const [request] = mockSavePort.save.mock.calls[0];
        expect(request.repoUrl.value).toBe(VALID_REPO_URL);
        expect(request.password.value).toBe(VALID_PASSWORD);
        expect(request.pat.value).toBe(VALID_PAT);
      });
    });

    describe('failure path — port returns failure', () => {
      it('should return failure when the port returns isSuccess false', async () => {
        mockSavePort.save.mockResolvedValue(
          PostGitCredentialResponse.failure('Credenziali già esistenti'),
        );

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
      });

      it('should propagate the error message returned by the port', async () => {
        const portMessage = 'Credenziali già esistenti';
        mockSavePort.save.mockResolvedValue(PostGitCredentialResponse.failure(portMessage));

        const result = await service.execute(makeCommand());

        expect(result.errorMessage).toBe(portMessage);
      });

      it('should use a fallback message when the port returns failure with no message', async () => {
        // Simulates a PostGitCredentialResponse.failure('') edge-case where errorMessage
        // is falsy, triggering the || fallback in the service
        mockSavePort.save.mockResolvedValue(new PostGitCredentialResponse(false, undefined));

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Unknown error occurred while saving Git credentials');
      });
    });

    describe('failure path — port throws', () => {
      it('should return failure when the port throws an Error', async () => {
        mockSavePort.save.mockRejectedValue(new Error('DB unreachable'));

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
      });

      it('should include the Error message in the result', async () => {
        mockSavePort.save.mockRejectedValue(new Error('DB unreachable'));

        const result = await service.execute(makeCommand());

        expect(result.errorMessage).toContain('Failed to save Git credentials');
        expect(result.errorMessage).toContain('DB unreachable');
      });

      it('should handle non-Error throws and stringify them', async () => {
        mockSavePort.save.mockRejectedValue('unexpected string error');

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toContain('unexpected string error');
      });

      it('should handle thrown objects that are not Error instances', async () => {
        mockSavePort.save.mockRejectedValue({ code: 503, msg: 'service unavailable' });

        const result = await service.execute(makeCommand());

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toContain('Failed to save Git credentials');
      });
    });
  });
});
