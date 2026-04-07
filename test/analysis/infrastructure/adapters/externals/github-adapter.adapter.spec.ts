import { GitHubAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';
import { CheckAvailabilityRequest } from '../../../../../src/analysis/application/DTOs/models/requests/check-availability-request-model.model';
import { CloneRepoRequest } from '../../../../../src/analysis/application/DTOs/models/requests/clone-repo-request-model.model';
import { RepoURL } from '../../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PersonalAccessToken } from '../../../../../src/analysis/domain/value-objects/personal-access-token.vo';
import { CommitHash } from '../../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { BranchName } from '../../../../../src/analysis/domain/value-objects/branch-name.vo';
import { AnalysisId } from '../../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { v7 as uuid } from 'uuid';

interface ExecResult {
  stdout: string;
  stderr: string;
}

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;
  let mockExecAsync: jest.Mock<Promise<ExecResult>, [string]>;

  const repoUrl = RepoURL.create('https://github.com/SkarabGroup/DocumentazioneProgetto');
  const pat = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));
  const analysisId = AnalysisId.create(uuid());

  beforeEach(() => {
    mockExecAsync = jest.fn<Promise<ExecResult>, [string]>();

    // Castiamo il mock alla firma attesa dal costruttore dell'adapter
    adapter = new GitHubAdapter(
      mockExecAsync as unknown as (command: string) => Promise<ExecResult>,
    );

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});

    process.env.CODE_GUARDIAN_TOKEN = 'fallback-token';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('check()', () => {
    it('should return success with SHA when a commit is requested', async () => {
      const sha = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
      mockExecAsync.mockResolvedValue({ stdout: `${sha}\n200`, stderr: '' });

      const request = new CheckAvailabilityRequest(repoUrl, pat, null, CommitHash.create(sha));
      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(true);
      expect(response.commit).toBe(sha);
      expect(response.branch).toBe('resolved-commit');
    });

    it('should return PENDING for default branch resolution', async () => {
      const body = JSON.stringify({ default_branch: 'develop' });
      mockExecAsync.mockResolvedValue({ stdout: `${body}\n200`, stderr: '' });

      const request = new CheckAvailabilityRequest(repoUrl, pat, null, null);
      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(true);
      expect(response.branch).toBe('develop');
      expect(response.commit).toBe('PENDING');
    });

    it('should return failure on 404 error', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'Not Found\n404', stderr: '' });

      const request = new CheckAvailabilityRequest(repoUrl, null, null, null);
      const response = await adapter.check(request);

      expect(response.isAccessible).toBe(false);
      expect(response.errorMessage).toBeUndefined();
    });
  });

  describe('clone()', () => {
    const tempPath = `/tmp/${analysisId.value}`;

    it('should use --depth 1 when cloning a branch', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const request = new CloneRepoRequest(
        repoUrl,
        analysisId,
        pat,
        BranchName.create('main'),
        null,
      );
      const response = await adapter.clone(request);

      expect(response.cloned).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('git clone --quiet --depth 1 --branch main'),
      );
    });

    it('should clone fully and then checkout when a commit is provided', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      const sha = 'f'.repeat(40);

      const request = new CloneRepoRequest(repoUrl, analysisId, pat, null, CommitHash.create(sha));
      const response = await adapter.clone(request);

      expect(response.cloned).toBe(true);
      const calls = mockExecAsync.mock.calls.map((c: [string]) => c[0]);

      const cloneCall = calls.find((c) => c.includes('git clone')) ?? '';
      expect(cloneCall).not.toContain('--depth 1');
      expect(calls).toContain(`git -C ${tempPath} checkout --quiet ${sha}`);
    });

    it('should cleanup and return failure if a git command throws', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // rm -rf
        .mockRejectedValueOnce(new Error('Network error'));

      const request = new CloneRepoRequest(repoUrl, analysisId, null, null, null);
      const response = await adapter.clone(request);

      expect(response.cloned).toBe(false);
      expect(mockExecAsync).toHaveBeenLastCalledWith(`rm -rf ${tempPath}`);
    });
  });
});
