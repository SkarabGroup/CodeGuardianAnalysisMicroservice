import { GitHubAdapter } from '../../../../src/infrastructure/adapters/externals/github-adapter.adapter';
import { CheckAvailabilityRequestModel } from '../../../../src/application/DTOs/models/requests/check-availability-request-model.model';

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;
  let mockExecAsync: jest.Mock;

  beforeEach(() => {
    mockExecAsync = jest.fn();
    adapter = new GitHubAdapter(mockExecAsync);
  });

  describe('check method - Commit requests', () => {
    it('should return success when commit exists (200 status)', async () => {
      const commit = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
      mockExecAsync.mockResolvedValue({
        stdout: `${commit}\n200`,
        stderr: '',
      });

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        null,
        commit,
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        null,
        'nonexistent123',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        null,
        'some_commit',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'develop',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'nonexistent-branch',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        null,
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo',
        'ghp_token123',
        'main',
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

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        'ghp_token123',
        'main',
        null,
      );

      await adapter.check(request);

      const callArg = (mockExecAsync.mock.calls[0] as string[])[0];
      expect(callArg).toContain('-H "Authorization: Bearer ghp_token123"');
    });

    it('should not include Authorization header when token is null', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '{"name":"main"}\n200',
        stderr: '',
      });

      const request = new CheckAvailabilityRequestModel(
        'https://github.com/user/repo.git',
        null,
        'main',
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

import { CloneRepoRequestModel } from '../../../../src/application/DTOs/models/requests/clone-repo-request-model.model';
import { CloneRepoResponseModel } from '../../../../src/application/DTOs/models/responses/clone-repo-response-model.model';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
describe('GitHubAdapter - clone', () => {
  let mockExec: jest.Mock;
  let adapter: GitHubAdapter;

  const baseRequest = new CloneRepoRequestModel(
    'https://github.com/user/repo.git',
    'test-123',
    'test-token',
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
      'git clone --quiet  https://test-token@github.com/user/repo /tmp/test-123',
    );
    expect(result).toEqual(
      new CloneRepoResponseModel(true, '/tmp/test-123', 'Repository cloned successfully.'),
    );
  });

  // ─── CON BRANCH ─────────────────────────────────────────────

  it('clone with branch', async () => {
    const result = await adapter.clone({
      ...baseRequest,
      patToken: 'test-token',
      branch: 'develop',
    });

    expect(mockExec).toHaveBeenCalledWith(
      'git clone --quiet --branch develop https://test-token@github.com/user/repo /tmp/test-123',
    );
    expect(result).toEqual(
      new CloneRepoResponseModel(true, '/tmp/test-123', 'Repository cloned successfully.'),
    );
  });

  it('clone with PAT token', async () => {
    const result = await adapter.clone({ ...baseRequest, patToken: 'ghp_mytoken123' });

    expect(mockExec).toHaveBeenCalledWith(
      'git clone --quiet  https://ghp_mytoken123@github.com/user/repo /tmp/test-123',
    );
    expect(result).toEqual(
      new CloneRepoResponseModel(true, '/tmp/test-123', 'Repository cloned successfully.'),
    );
  });

  it('clone with commit', async () => {
    const result = await adapter.clone({ ...baseRequest, commit: 'abc1234' });

    expect(mockExec).toHaveBeenCalledTimes(4);
    expect(mockExec).toHaveBeenNthCalledWith(4, 'git -C /tmp/test-123 checkout --quiet abc1234');
    expect(result).toEqual(
      new CloneRepoResponseModel(true, '/tmp/test-123', 'Repository cloned successfully.'),
    );
  });

  //ERRORS
  it('stderr →  false', async () => {
    mockExec.mockResolvedValueOnce({ stdout: '', stderr: 'fatal: repository not found' });

    const result = await adapter.clone(baseRequest);

    expect(result).toEqual(
      new CloneRepoResponseModel(
        false,
        undefined,
        'Failed to create target directory for cloning.',
      ),
    );
  });
});

const makeRequest = (overrides: Partial<CloneRepoRequestModel> = {}): CloneRepoRequestModel => ({
  analysisId: 'test-123',
  repoUrl: 'https://github.com/org/repo',
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

    expect(result.success).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to create target directory for cloning.');
  });

  it('returns failure when mkdir produces stderr', async () => {
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // rm -rf
      .mockResolvedValueOnce({ stdout: '', stderr: 'cannot create directory' }); // mkdir

    const result = await adapter.clone(makeRequest());

    expect(result.success).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to create target directory for cloning.');
  });

  // ─── Authentication URL ───────────────────────────────────────────────────────

  it('uses patToken when provided', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(makeRequest({ patToken: 'my-pat' }));

    const cloneCall = (execAsync.mock.calls[2] as [string])[0];
    expect(cloneCall).toContain('https://my-pat@github.com/org/repo');
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

    expect(result.success).toBe(true);
    expect(result.localFolderPath).toBe('/tmp/test-123');
    expect(result.errorMessage).toBe('Repository cloned successfully.');
    expect(execAsync).toHaveBeenCalledTimes(3); // rm + mkdir + clone (no checkout)
  });

  it('includes --branch flag in the clone command when branch is provided', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(makeRequest({ branch: 'feature/my-branch' }));

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

    const result = await adapter.clone(makeRequest({ commit: 'abc123' }));

    expect(result.success).toBe(true);
    expect(result.localFolderPath).toBe('/tmp/test-123');

    const checkoutCall = (execAsync.mock.calls[3] as [string])[0];
    expect(checkoutCall).toContain('git -C /tmp/test-123 checkout --quiet abc123');
  });

  // ─── Clone failures ───────────────────────────────────────────────────────────

  it('returns failure and cleans up when git clone throws', async () => {
    mockSetupSuccess();
    execAsync
      .mockRejectedValueOnce(new Error('network error')) // git clone
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest());

    expect(result.success).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to clone repository.');

    const cleanupCall = (execAsync.mock.calls[3] as [string])[0];
    expect(cleanupCall).toBe('rm -rf /tmp/test-123');
  });

  // ─── Checkout failures ────────────────────────────────────────────────────────

  it('returns failure and cleans up when checkout throws with stderr property', async () => {
    mockSetupSuccess();
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git clone
      .mockRejectedValueOnce({ stderr: 'pathspec not found' }) // git checkout
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest({ commit: 'deadbeef' }));

    expect(result.success).toBe(false);
    expect(result.localFolderPath).toBeUndefined();
    expect(result.errorMessage).toBe('Failed to checkout commit.');

    const cleanupCall = (execAsync.mock.calls[4] as [string])[0];
    expect(cleanupCall).toBe('rm -rf /tmp/test-123');
  });

  it('returns failure and cleans up when checkout throws with unknown error shape', async () => {
    mockSetupSuccess();
    execAsync
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git clone
      .mockRejectedValueOnce('unexpected string error') // git checkout
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup

    const result = await adapter.clone(makeRequest({ commit: 'deadbeef' }));

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Failed to checkout commit.');
  });

  // ─── URL normalisation ────────────────────────────────────────────────────────

  it('strips .git suffix from the repo URL when building the auth URL', async () => {
    mockSetupSuccess();
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // git clone

    await adapter.clone(makeRequest({ repoUrl: 'https://github.com/org/repo.git' }));

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

    expect(result.success).toBe(false);
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

    expect(result.success).toBe(false);
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

    const result = await adapter.clone(makeRequest({ commit: 'abc123' }));

    expect(result.success).toBe(false);
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

    const result = await adapter.clone(makeRequest({ commit: 'abc123' }));

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Failed to checkout commit.');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unknown error during checkout: unexpected string error',
    );

    consoleErrorSpy.mockRestore();
  });
});
