import { GitHubAdapter } from '../../../../src/infrastructure/adapters/externals/github-adapter.ad';
import { GitAccessRequestModel } from '../../../../src/application/DTOs/models/git-access-request-model.model';
describe('adapter constructor', () => {
  it('can be instantiated without arguments (uses real promisify(exec) as default)', () => {
    expect(() => new GitHubAdapter()).not.toThrow();
  });
});
type ExecResult = { stdout: string; stderr: string };

const VALID_SHA = 'a'.repeat(40);

function curlOutput(body: string, statusCode: number): string {
  return `${body}\n${statusCode}`;
}

//use this to isolate the test, it does not depend from errors from other module/models ecc...
function makeRequest(
  overrides: Partial<{
    repositoryUrl: string;
    branchName: string;
    commitHash: string | null;
    personalAccessToken: string | null;
  }> = {},
): GitAccessRequestModel {
  return new GitAccessRequestModel(
    overrides.repositoryUrl !== undefined
      ? overrides.repositoryUrl
      : 'https://github.com/owner/repo',
    overrides.branchName !== undefined ? overrides.branchName : 'main',
    overrides.commitHash !== undefined ? overrides.commitHash : null,
    overrides.personalAccessToken !== undefined ? overrides.personalAccessToken : 'github_pat_test',
  );
}

describe('GitHubAdapter', () => {
  let mockExecAsync: jest.MockedFunction<(cmd: string) => Promise<ExecResult>>; //it mokes the curl response
  let adapter: GitHubAdapter;

  beforeEach(() => {
    mockExecAsync = jest.fn<Promise<ExecResult>, [string]>(); //to return always what I want and to have type safety on the arguments and return value istead of a regular curl command execution
    adapter = new GitHubAdapter(mockExecAsync);
  });

  // I Used a AAA test pattern (Arrange-Act-Assert) to have a clear structure in the tests and to separate the setup, execution and verification phases of each test case. This makes the tests easier to read and understand, as well as to maintain and extend in the future.
  // -------------------------------------------------------------------------
  // EXIST
  // -------------------------------------------------------------------------

  describe('EXIST', () => {
    it('returns EXIST when branch endpoint returns 200 with valid JSON', async () => {
      const body = JSON.stringify({ name: 'main', commit: {} });
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(body, 200), stderr: '' });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('EXISTS');
    });

    it('returns EXIST when commit endpoint returns 200 with a valid 40-char SHA', async () => {
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(VALID_SHA, 200), stderr: '' });

      const result = await adapter.validateRequest(makeRequest({ commitHash: VALID_SHA }));

      expect(result.status).toBe('EXISTS');
    });
  });

  // -------------------------------------------------------------------------
  // NOT_FOUND
  // -------------------------------------------------------------------------

  describe('NOT_FOUND', () => {
    it('returns NOT_FOUND on 404', async () => {
      const body = JSON.stringify({ message: 'Not Found' });
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(body, 404), stderr: '' });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('NOT_FOUND');
    });

    it('returns NOT_FOUND when 200 branch response has no name field', async () => {
      const body = JSON.stringify({ unexpected: 'shape' });
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(body, 200), stderr: '' });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('NOT_FOUND');
    });
  });

  // -------------------------------------------------------------------------
  // UNAUTHORIZED
  // -------------------------------------------------------------------------

  describe('UNAUTHORIZED', () => {
    it('returns UNAUTHORIZED on 401 with token', async () => {
      const body = JSON.stringify({ message: 'Bad credentials' });
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(body, 401), stderr: '' });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('UNAUTHORIZED');
    });

    it('returns UNAUTHORIZED on 401 without token', async () => {
      const body = JSON.stringify({ message: 'Bad credentials' });
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(body, 401), stderr: '' });

      const result = await adapter.validateRequest(makeRequest({ personalAccessToken: null }));

      expect(result.status).toBe('UNAUTHORIZED');
    });
  });

  // -------------------------------------------------------------------------
  // UNAVAILABLE
  // -------------------------------------------------------------------------

  describe('UNAVAILABLE', () => {
    it('returns UNAVAILABLE when curl writes to stderr', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'curl: (6) Could not resolve host: api.github.com',
      });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('UNAVAILABLE');
    });

    it('returns UNAVAILABLE when execAsync throws', async () => {
      mockExecAsync.mockRejectedValue(new Error('spawn error'));

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('UNAVAILABLE');
    });

    it('returns UNAVAILABLE on unexpected status code (500)', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: curlOutput('Internal Server Error', 500),
        stderr: '',
      });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('UNAVAILABLE');
    });

    it('returns UNAVAILABLE when commit endpoint returns 200 but body is not a valid SHA', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: curlOutput('not-a-sha', 200),
        stderr: '',
      });

      const result = await adapter.validateRequest(makeRequest({ commitHash: VALID_SHA }));

      expect(result.status).toBe('UNAVAILABLE');
    });

    it('returns UNAVAILABLE when branch endpoint returns 200 with invalid JSON', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: curlOutput('{ broken json', 200),
        stderr: '',
      });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('UNAVAILABLE');
    });
  });

  // -------------------------------------------------------------------------
  // Curl command shape
  // -------------------------------------------------------------------------

  describe('curl command', () => {
    it('includes Authorization header when token is provided', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: curlOutput(JSON.stringify({ name: 'main' }), 200),
        stderr: '',
      });

      await adapter.validateRequest(makeRequest({ personalAccessToken: 'my_token' }));

      expect(mockExecAsync.mock.calls[0][0]).toContain('Authorization: Bearer my_token');
    });

    it('omits Authorization header when token is null', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: curlOutput(JSON.stringify({ name: 'main' }), 200),
        stderr: '',
      });

      await adapter.validateRequest(makeRequest({ personalAccessToken: null }));

      expect(mockExecAsync.mock.calls[0][0]).not.toContain('Authorization');
    });

    it('uses SHA accept header and commits URL when commitHash is provided', async () => {
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(VALID_SHA, 200), stderr: '' });

      await adapter.validateRequest(makeRequest({ commitHash: VALID_SHA }));

      const command = mockExecAsync.mock.calls[0][0];
      expect(command).toContain('application/vnd.github.sha');
      expect(command).toContain(`/commits/${VALID_SHA}`);
    });

    it('uses JSON accept header and branches URL when commitHash is null', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: curlOutput(JSON.stringify({ name: 'develop' }), 200),
        stderr: '',
      });

      await adapter.validateRequest(makeRequest({ commitHash: null, branchName: 'develop' }));

      const command = mockExecAsync.mock.calls[0][0];
      expect(command).toContain('application/vnd.github+json');
      expect(command).toContain('/branches/develop');
    });

    it('strips .git suffix from branch repository URL', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: curlOutput(JSON.stringify({ name: 'main' }), 200),
        stderr: '',
      });

      await adapter.validateRequest(
        makeRequest({ repositoryUrl: 'https://github.com/owner/repo.git' }),
      );

      const command = mockExecAsync.mock.calls[0][0];
      expect(command).not.toContain('repo.git');
      expect(command).toContain('owner/repo');
    });

    it('strips .git suffix from commit repository URL', async () => {
      mockExecAsync.mockResolvedValue({ stdout: curlOutput(VALID_SHA, 200), stderr: '' });

      await adapter.validateRequest(
        makeRequest({
          repositoryUrl: 'https://github.com/owner/repo.git',
          commitHash: VALID_SHA,
        }),
      );

      const command = mockExecAsync.mock.calls[0][0];
      expect(command).not.toContain('repo.git');
      expect(command).toContain('owner/repo');
    });
  });

  describe('edge cases', () => {
    it('returns UNAVAILABLE and calls String() when rejected value is not an Error', async () => {
      mockExecAsync.mockRejectedValue('plain string rejection');

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('UNAVAILABLE');
    });

    it('returns UNAVAILABLE when stdout is completely empty', async () => {
      // Simuliamo un output curl totalmente vuoto (zero righe)
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await adapter.validateRequest(makeRequest());

      expect(result.status).toBe('UNAVAILABLE');
    });
  });
});
