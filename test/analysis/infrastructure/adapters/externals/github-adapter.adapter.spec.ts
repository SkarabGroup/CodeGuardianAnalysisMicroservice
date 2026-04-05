import { GitHubAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';
import { CheckAvailabilityRequest } from '../../../../../src/analysis/application/DTOs/models/requests/check-availability-request-model.model';

import { CloneRepoRequest } from '../../../../../src/analysis/application/DTOs/models/requests/clone-repo-request-model.model';
import { CloneRepoResponse } from '../../../../../src/analysis/application/DTOs/models/responses/clone-repo-response-model.model';
import { RepoURL } from '../../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PersonalAccessToken } from '../../../../../src/analysis/domain/value-objects/personal-access-token.vo';
import { CommitHash } from '../../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { BranchName } from '../../../../../src/analysis/domain/value-objects/branch-name.vo';
import { AnalysisId } from '../../../../../src/analysis/domain/value-objects/analysis-id.vo';

import { v7 as uuid } from 'uuid';

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;
  let mockExecAsync: jest.Mock;

  // Spie per catturare i log ed evitare che appaiano nel terminale
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    mockExecAsync = jest.fn();
    adapter = new GitHubAdapter(mockExecAsync);

    // "Silenziamo" i log durante i test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Ripristiniamo la console originale dopo ogni test
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('check method - Commit requests', () => {
    it('should return success when commit exists (200 status)', async () => {
      const commit = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
      mockExecAsync.mockResolvedValue({
        stdout: `${commit}\n200`,
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        null,
        CommitHash.create(commit),
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(true);
      expect(response.commit).toBe(commit);
      expect(response.errorMessage).toBe('Completed successfully.');
    });

    it('should return failure when commit not found (404 status)', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"message":"Not Found"}\n404',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        null,
        CommitHash.create('a'.repeat(40)),
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('The requested resource was not found.');
    });

    it('should return failure when response is not valid SHA (200 status)', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'invalid-sha\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        null,
        CommitHash.create('a'.repeat(40)),
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('The requested commit was not found.');
    });
  });

  describe('check method - Branch requests', () => {
    it('should return success when branch exists (200 status)', async () => {
      const sha = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
      mockExecAsync.mockResolvedValue({
        stdout: `{"name":"main","commit":{"sha":"${sha}"}}\n200`,
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(true);
      expect(response.commit).toBe(sha);
      expect(response.errorMessage).toBe('Completed successfully.');
    });

    it('should return success when branch exists without commit sha (200 status)', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"name":"develop"}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('develop'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(true);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('Completed successfully.');
    });

    it('should return failure when branch not found (404 status)', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"message":"Not Found"}\n404',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('nonexistent-branch'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('The requested resource was not found.');
    });

    it('should return failure when JSON response missing name field (200 status)', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"commit":{"sha":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"}}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('The requested branch was not found.');
    });
  });

  describe('check method - Error handling', () => {
    it('should return failure on unexpected status code', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"message":"Server Error"}\n500',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe(
        'An unexpected error occurred while checking availability.',
      );
    });

    it('should return failure on stderr', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'curl: (7) Failed to connect',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('An error occurred while checking availability.');
    });

    it('should return failure on empty stdout', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe(
        'The response from GitHub was empty, which is unexpected.',
      );
    });

    it('should return failure on exception thrown', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command execution failed'));

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('An error occurred while checking availability.');
    });

    it('should return failure on invalid JSON response (200 status)', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{invalid json}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('Failed to parse GitHub JSON response.');
    });
  });

  describe('URL building', () => {
    it('should build correct commit URL', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        null,
        CommitHash.create('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'),
      );

      await adapter.check(request);

      const callArg = (mockExecAsync.mock.calls[0] as string[])[0];
      expect(callArg).toContain(
        'https://api.github.com/repos/user/repo/commits/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      );
      expect(callArg).toContain('application/vnd.github.sha');
    });

    it('should build correct branch URL', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"name":"main"}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      await adapter.check(request);

      const callArg = (mockExecAsync.mock.calls[0] as string[])[0];
      expect(callArg).toContain('https://api.github.com/repos/user/repo/branches/main');
      expect(callArg).toContain('application/vnd.github+json');
    });

    it('should handle repository URL without .git suffix', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"name":"main"}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      await adapter.check(request);

      const callArg = (mockExecAsync.mock.calls[0] as string[])[0];
      expect(callArg).toContain('https://api.github.com/repos/user/repo/branches/main');
    });
  });

  describe('Authorization header', () => {
    it('should include Authorization header when token is provided', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"name":"main"}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
        BranchName.create('main'),
        null,
      );

      await adapter.check(request);

      const callArg = (mockExecAsync.mock.calls[0] as string[])[0];
      expect(callArg).toContain('-H "Authorization: Bearer ' + 'ghp_' + 'A'.repeat(36));
    });

    it('should not include Authorization header when token is null', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"name":"main"}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo.git'),
        null,
        BranchName.create('main'),
        null,
      );

      await adapter.check(request);

      const callArg = (mockExecAsync.mock.calls[0] as string[])[0];
      expect(callArg).not.toContain('Authorization');
    });

    it('should construct a real adapter', () => {
      const realAdapter = new GitHubAdapter();
      expect(realAdapter).toBeInstanceOf(GitHubAdapter);
    });
  });
});

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('GitHubAdapter - clone', () => {
  let mockExec: jest.Mock;
  let adapter: GitHubAdapter;

  const validAnalysisId = AnalysisId.create(uuid());
  const baseRequest = new CloneRepoRequest(
    RepoURL.create('https://github.com/user/repo.git'),
    validAnalysisId,
    PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
    null,
    null,
  );

  beforeEach(() => {
    mockExec = jest.fn().mockResolvedValue({ stdout: '', stderr: '' }); // default per tutti i test
    adapter = new GitHubAdapter(mockExec);
  });

  it('clone base  → success', async () => {
    const result = await adapter.clone(baseRequest);

    expect(mockExec).toHaveBeenCalledTimes(3); // mkdir + git clone + checkout
    expect(mockExec).toHaveBeenNthCalledWith(
      3,
      'git clone --quiet  https://' +
        'ghp_' +
        'A'.repeat(36) +
        '@github.com/user/repo /tmp/' +
        validAnalysisId.value,
    );
    expect(result).toEqual(CloneRepoResponse.success('/tmp/' + validAnalysisId.value));
  });

  // ─── CON BRANCH ─────────────────────────────────────────────

  it('clone with branch', async () => {
    const result = await adapter.clone({
      ...baseRequest,
      patToken: PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
      branch: BranchName.create('develop'),
    });

    expect(mockExec).toHaveBeenCalledWith(
      'git clone --quiet --branch develop https://' +
        'ghp_' +
        'A'.repeat(36) +
        '@github.com/user/repo /tmp/' +
        validAnalysisId.value,
    );
    expect(result).toEqual(CloneRepoResponse.success('/tmp/' + validAnalysisId.value));
  });

  it('clone with PAT token', async () => {
    const result = await adapter.clone({
      ...baseRequest,
      patToken: PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
    });

    expect(mockExec).toHaveBeenCalledWith(
      'git clone --quiet  https://' +
        'ghp_' +
        'A'.repeat(36) +
        '@github.com/user/repo /tmp/' +
        validAnalysisId.value,
    );
    expect(result).toEqual(CloneRepoResponse.success('/tmp/' + validAnalysisId.value));
  });

  it('clone with commit', async () => {
    const result = await adapter.clone({
      ...baseRequest,
      commit: CommitHash.create('a'.repeat(40)),
    });

    expect(mockExec).toHaveBeenCalledTimes(4);
    expect(mockExec).toHaveBeenNthCalledWith(
      4,
      'git -C /tmp/' + validAnalysisId.value + ' checkout --quiet ' + 'a'.repeat(40),
    );
    expect(result).toEqual(CloneRepoResponse.success('/tmp/' + validAnalysisId.value));
  });

  //ERRORS
  it('stderr →  false', async () => {
    mockExec.mockResolvedValueOnce({ stdout: '', stderr: 'fatal: repository not found' });

    const result = await adapter.clone(baseRequest);

    expect(result).toEqual(
      CloneRepoResponse.failure('Failed to create target directory for cloning.'),
    );
  });
});

const validAnalysisId = AnalysisId.create(uuid());
const makeRequest = (overrides: Partial<CloneRepoRequest> = {}): CloneRepoRequest => ({
  analysisId: validAnalysisId,
  repoUrl: RepoURL.create('https://github.com/org/repo'),
  branch: null,
  commit: null,
  patToken: null,
  ...overrides,
});

describe('GitHubAdapter.clone', () => {
  let execAsync: jest.Mock;
  let adapter: GitHubAdapter;

  beforeEach(() => {
    execAsync = jest.fn();
    adapter = new GitHubAdapter(execAsync);
    process.env.CODE_GUARDIAN_TOKEN = 'env-token';
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.CODE_GUARDIAN_TOKEN;
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Simulate rm -rf and mkdir succeeding, then the clone command */
  const mockSetupSuccess = () => {
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // rm -rf
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // mkdir
  };

  // ─── Directory setup ─────────────────────────────────────────────────────────

  it('returns failure when rm -rf produces stderr', async () => {
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: 'permission denied' }) // rm -rf
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // mkdir

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to create target directory for cloning.');
  });

  it('returns failure when mkdir produces stderr', async () => {
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // rm -rf
      .mockResolvedValueOnce({ stdout: '', stderr: 'cannot create directory' }); // mkdir

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to create target directory for cloning.');
  });

  // ─── Authentication URL ───────────────────────────────────────────────────────

  it('uses patToken when provided', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(
      makeRequest({ patToken: PersonalAccessToken.create('ghp_' + 'A'.repeat(36)) }),
    );

    const cloneCall = (execAsync.mock.calls[2] as [string])[0];
    expect(cloneCall).toContain('https://' + 'ghp_' + 'A'.repeat(36) + '@github.com/org/repo');
  });

  it('falls back to CODE_GUARDIAN_TOKEN env variable when no patToken', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(makeRequest({ patToken: null }));

    const cloneCall = (execAsync.mock.calls[2] as [string])[0];
    expect(cloneCall).toContain('https://env-token@github.com/org/repo');
  });

  // ─── Successful clones ────────────────────────────────────────────────────────

  it('returns success with correct path when clone succeeds (no branch, no commit)', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(true);
    expect(result.localFolderPath).toBe('/tmp/' + validAnalysisId.value);
    expect(execAsync).toHaveBeenCalledTimes(3); // rm + mkdir + clone (no checkout)
  });

  it('includes --branch flag in the clone command when branch is provided', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(makeRequest({ branch: BranchName.create('feature/my-branch') }));

    const cloneCall = (execAsync.mock.calls[2] as [string])[0];
    expect(cloneCall).toContain('--branch feature/my-branch');
  });

  it('omits --branch flag when branch is null', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(makeRequest({ branch: null }));

    const cloneCall = (execAsync.mock.calls[2] as [string])[0];
    expect(cloneCall).not.toContain('--branch');
  });

  it('returns success and runs checkout when commit is provided', async () => {
    mockSetupSuccess();
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git clone
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // git checkout

    const result = await adapter.clone(makeRequest({ commit: CommitHash.create('a'.repeat(40)) }));

    expect(result.cloned).toBe(true);
    expect(result.localFolderPath).toBe('/tmp/' + validAnalysisId.value);

    const checkoutCall = (execAsync.mock.calls[3] as [string])[0];
    expect(checkoutCall).toContain(
      'git -C /tmp/' + validAnalysisId.value + ' checkout --quiet ' + 'a'.repeat(40),
    );
  });

  // ─── Clone failures ───────────────────────────────────────────────────────────

  it('returns failure and cleans up when git clone throws', async () => {
    mockSetupSuccess();
    execAsync
      .mockRejectedValueOnce(new Error('network error')) // git clone
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to clone repository.');

    const cleanupCall = (execAsync.mock.calls[3] as [string])[0];
    expect(cleanupCall).toBe('rm -rf /tmp/' + validAnalysisId.value);
  });

  // ─── Checkout failures ────────────────────────────────────────────────────────

  it('returns failure and cleans up when checkout throws with stderr property', async () => {
    mockSetupSuccess();
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git clone
      .mockRejectedValueOnce({ stderr: 'pathspec not found' }) // git checkout
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest({ commit: CommitHash.create('a'.repeat(40)) }));

    expect(result.cloned).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to checkout commit.');

    const cleanupCall = (execAsync.mock.calls[4] as [string])[0];
    expect(cleanupCall).toBe('rm -rf /tmp/' + validAnalysisId.value);
  });

  it('returns failure and cleans up when checkout throws with unknown error shape', async () => {
    mockSetupSuccess();
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git clone
      .mockRejectedValueOnce('unexpected string error') // git checkout
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest({ commit: CommitHash.create('a'.repeat(40)) }));

    expect(result.cloned).toBe(false);
    expect(result.errorMessage).toBe('Failed to checkout commit.');
  });

  // ─── URL normalisation ────────────────────────────────────────────────────────

  it('strips .git suffix from the repo URL when building the auth URL', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(
      makeRequest({ repoUrl: RepoURL.create('https://github.com/org/repo.git') }),
    );

    const cloneCall = (execAsync.mock.calls[2] as [string])[0];
    expect(cloneCall).toContain('github.com/org/repo');
    expect(cloneCall).not.toContain('.git');
  });
  // ─── git clone catch ──────────────────────────────────────────────────────────

  it('git clone catch: logs error.message when error is an instance of Error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSetupSuccess();
    execAsync
      .mockRejectedValueOnce(new Error('network timeout')) // git clone throws an Error instance
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(false);
    expect(result.errorMessage).toBe('Failed to clone repository.');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error executing git clone: network timeout');

    consoleErrorSpy.mockRestore();
  });

  it('git clone catch: logs String(error) when error is not an instance of Error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSetupSuccess();
    execAsync
      .mockRejectedValueOnce('plain string error') // git clone throws a plain string
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(false);
    expect(result.errorMessage).toBe('Failed to clone repository.');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error executing git clone: plain string error');

    consoleErrorSpy.mockRestore();
  });

  // ─── git checkout catch (else branch) ────────────────────────────────────────

  it('checkout catch else: logs error.message when error is an instance of Error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSetupSuccess();
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git clone
      .mockRejectedValueOnce(new Error('detached HEAD')) // git checkout throws Error (no stderr prop)
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest({ commit: CommitHash.create('a'.repeat(40)) }));

    expect(result.cloned).toBe(false);
    expect(result.errorMessage).toBe('Failed to checkout commit.');
    // Error instanceof Error → entra nell'else, usa error.message
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown error during checkout: detached HEAD');

    consoleErrorSpy.mockRestore();
  });

  it('checkout catch else: logs String(error) when error is a plain string', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSetupSuccess();
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git clone
      .mockRejectedValueOnce('unexpected string error') // git checkout throws string
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest({ commit: CommitHash.create('a'.repeat(40)) }));

    expect(result.cloned).toBe(false);
    expect(result.errorMessage).toBe('Failed to checkout commit.');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unknown error during checkout: unexpected string error',
    );

    consoleErrorSpy.mockRestore();
  });
});
