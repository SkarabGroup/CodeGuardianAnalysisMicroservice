import { GitHubAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';
import { CheckAvailabilityRequest } from '../../../../../src/analysis/application/DTOs/models/requests/check-availability-request-model.model';

import { CloneRepoRequest } from '../../../../../src/analysis/application/DTOs/models/requests/clone-repo-request-model.model';
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
      expect(response.errorMessage).toBe(undefined);
    });

    it('should handle non-Error exceptions in check method', async () => {
      const strangeError = 'Critical System Failure';
      mockExecAsync.mockRejectedValue(strangeError);

      const request = {
        repoUrl: { value: 'https://github.com/user/repo' },
      } as CheckAvailabilityRequest;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await adapter.check(request);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(strangeError));
      expect(result.isAccessible).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should include the token in the clone URL when provided', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const request = {
        analysisId: { value: '123' },
        repoUrl: { value: 'https://github.com/user/repo' },
        patToken: { value: 'my-secret-token' },
      } as CloneRepoRequest;

      await adapter.clone(request);

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('https://my-secret-token@github.com/user/repo.git'),
      );
    });

    it('should return failure when GitHub returns invalid JSON (catch block)', async () => {
      const invalidJsonBody = 'Not a JSON';
      const curlResponse = `${invalidJsonBody}\n200`;

      mockExecAsync.mockResolvedValue({ stdout: curlResponse, stderr: '' });
      const repoUrl = RepoURL.create('https://github.com/user/repo');

      const request = new CheckAvailabilityRequest(repoUrl, null, null, null);
      const result = await adapter.check(request);

      expect(result.isAccessible).toBe(false);
      expect(result.errorMessage).toBe('Failed to parse GitHub JSON response.');
    });

    it('should return failure when JSON is valid but missing required fields', async () => {
      const unexpectedJsonBody = JSON.stringify({ some_other_field: 'value' });
      const curlResponse = `${unexpectedJsonBody}\n200`;

      mockExecAsync.mockResolvedValue({ stdout: curlResponse, stderr: '' });

      const repoUrl = RepoURL.create('https://github.com/user/repo');

      const request = new CheckAvailabilityRequest(repoUrl, null, null, null);
      const result = await adapter.check(request);

      expect(result.isAccessible).toBe(false);
      expect(result.errorMessage).toBe('Unexpected JSON structure.');
    });

    it('should return success with default_branch and PENDING when checking only repo availability', async () => {
      const mockJsonResponse = JSON.stringify({
        name: 'my-repo',
        default_branch: 'main',
        owner: { login: 'user' },
      });

      const curlStdout = `${mockJsonResponse}\n200`;
      mockExecAsync.mockResolvedValue({ stdout: curlStdout, stderr: '' });

      const request = new CheckAvailabilityRequest(
        RepoURL.create('https://github.com/user/repo'),
        null, // patToken
        null, // branch
        null, // commit
      );
      const result = await adapter.check(request);

      expect(result.isAccessible).toBe(true);
      expect(result.branch).toBe('main');
      expect(result.commit).toBe(null);
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
      expect(response.errorMessage).toBe(
        'The requested resource (repo, branch or commit) was not found.',
      );
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
      expect(response.errorMessage).toBe('Invalid SHA received from GitHub.');
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
      expect(response.errorMessage).toBe(undefined);
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

      expect(response.isAccessible).toBe(false);
      expect(response.commit).toBeNull();
      expect(response.errorMessage).toBe('Branch data incomplete.');
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
      expect(response.errorMessage).toBe(
        'The requested resource (repo, branch or commit) was not found.',
      );
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
      expect(response.errorMessage).toBe('Branch data incomplete.');
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
      expect(response.errorMessage).toBe('GitHub error (Status 500)');
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
      expect(response.errorMessage).toBe('Empty response from GitHub.');
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

describe('GitHubAdapter.clone', () => {
  let execAsync: jest.Mock;
  let adapter: GitHubAdapter;

  const validAnalysisId = AnalysisId.create(uuid());
  const repoUrl = 'https://github.com/org/repo';

  const makeRequest = (overrides: Partial<CloneRepoRequest> = {}): CloneRepoRequest =>
    ({
      analysisId: validAnalysisId,
      repoUrl: RepoURL.create(repoUrl),
      branch: null,
      commit: null,
      patToken: null,
      ...overrides,
    }) as CloneRepoRequest;

  beforeEach(() => {
    execAsync = jest.fn().mockResolvedValue({ stdout: '', stderr: '' });
    adapter = new GitHubAdapter(execAsync);
    process.env.CODE_GUARDIAN_TOKEN = 'env-token';
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.CODE_GUARDIAN_TOKEN;
  });

  /** Simula solo il successo del primo 'rm -rf' */
  const mockSetupSuccess = () => {
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf iniziale
  };

  // ─── Happy Path ─────────────────────────────────────────────────────────────

  it('returns success and runs correct commands for base clone', async () => {
    mockSetupSuccess();
    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(true);
    expect(result.localFolderPath).toBe(`/tmp/${validAnalysisId.value}`);

    // 1. rm -rf, 2. git clone
    expect(execAsync).toHaveBeenCalledTimes(2);
    expect(execAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        `git clone --quiet --depth 1 https://env-token@github.com/org/repo.git`,
      ),
    );
  });

  it('includes --branch flag and depth 1 when branch is provided', async () => {
    mockSetupSuccess();
    await adapter.clone(makeRequest({ branch: BranchName.create('develop') }));

    const cloneCall = (execAsync.mock.calls[1] as [string])[0];
    expect(cloneCall).toContain('--branch develop');
    expect(cloneCall).toContain('--depth 1');
  });

  it('runs checkout and NO depth limit when commit is provided', async () => {
    mockSetupSuccess();
    // 1. rm, 2. clone, 3. checkout
    const result = await adapter.clone(makeRequest({ commit: CommitHash.create('a'.repeat(40)) }));

    expect(result.cloned).toBe(true);
    expect(execAsync).toHaveBeenCalledTimes(3);

    const cloneCall = (execAsync.mock.calls[1] as [string])[0];
    const checkoutCall = (execAsync.mock.calls[2] as [string])[0];

    expect(cloneCall).not.toContain('--depth 1');
    expect(checkoutCall).toBe(
      `git -C /tmp/${validAnalysisId.value} checkout --quiet ${'a'.repeat(40)}`,
    );
  });

  // ─── Authentication ─────────────────────────────────────────────────────────

  it('prioritizes patToken over environment variable', async () => {
    mockSetupSuccess();
    const customToken = 'ghp_' + 'B'.repeat(36);
    await adapter.clone(makeRequest({ patToken: PersonalAccessToken.create(customToken) }));

    const cloneCall = (execAsync.mock.calls[1] as [string])[0];
    expect(cloneCall).toContain(`https://${customToken}@github.com/`);
  });

  // ─── Error Handling ─────────────────────────────────────────────────────────

  it('cleans up and returns failure when git clone fails', async () => {
    mockSetupSuccess(); // rm -rf iniziale ok
    execAsync.mockRejectedValueOnce(new Error('Network error')); // git clone fallisce
    execAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // rm -rf cleanup ok

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(false);
    expect(result.errorMessage).toBe('Network error');

    // Verifica cleanup: chiamata 1 (iniziale), chiamata 2 (clone fallito), chiamata 3 (cleanup)
    expect(execAsync).toHaveBeenCalledTimes(3);
    expect(execAsync).toHaveBeenNthCalledWith(3, `rm -rf /tmp/${validAnalysisId.value}`);
  });

  it('returns "Clone failed" if error is not an instance of Error', async () => {
    mockSetupSuccess();
    execAsync.mockRejectedValueOnce('Something went wrong'); // Stringa, non Error object

    const result = await adapter.clone(makeRequest());

    expect(result.errorMessage).toBe('Clone failed');
  });

  it('fails if the initial rm -rf fails', async () => {
    execAsync.mockRejectedValueOnce(new Error('Permission denied'));

    const result = await adapter.clone(makeRequest());

    expect(result.cloned).toBe(false);
    expect(result.errorMessage).toBe('Permission denied');
  });
});
