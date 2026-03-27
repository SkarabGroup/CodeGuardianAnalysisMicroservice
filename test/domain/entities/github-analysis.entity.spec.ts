import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { AnalysisStatus } from '../../../src/domain/entities/analysis.entity';
import { AnalysisId } from '../../../src/domain/value-objects/analysis-id.vo';
import { UserId } from '../../../src/domain/value-objects/user-id.vo';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../src/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../src/domain/value-objects/commit-hash.vo';
import { v4 as uuidv4 } from 'uuid';

const makeValidAnalysis = (commit?: CommitHash) =>
  GitHubAnalysis.create(
    AnalysisId.create(uuidv4()),
    UserId.create(uuidv4()),
    RepoURL.create('https://github.com/org/repo'),
    BranchName.create('main'),
    AnalysisStatus.PENDING,
    commit,
  );

describe('GitHubAnalysis Entity', () => {
  // ─── Creation ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should create a GitHubAnalysis without a commit', () => {
      const analysis = makeValidAnalysis();
      expect(analysis).toBeInstanceOf(GitHubAnalysis);
    });

    it('should create a GitHubAnalysis with a commit', () => {
      const commit = CommitHash.create('a'.repeat(40));
      const analysis = makeValidAnalysis(commit);
      expect(analysis.getCommit()).toBe(commit);
    });

    it('should set commit to null when not provided', () => {
      const analysis = makeValidAnalysis();
      expect(analysis.getCommit()).toBeNull();
    });

    it('should throw when repoURL is not a RepoURL instance', () => {
      expect(() =>
        GitHubAnalysis.create(
          AnalysisId.create(uuidv4()),
          UserId.create(uuidv4()),
          'https://github.com/org/repo',
          BranchName.create('main'),
          AnalysisStatus.PENDING,
        ),
      ).toThrow('Invalid repoURL value');
    });

    it('should throw when branch is not a BranchName instance', () => {
      expect(() =>
        GitHubAnalysis.create(
          AnalysisId.create(uuidv4()),
          UserId.create(uuidv4()),
          RepoURL.create('https://github.com/org/repo'),
          'main',
          AnalysisStatus.PENDING,
        ),
      ).toThrow('Invalid branch value');
    });

    it('should throw when commit is provided but is not a CommitHash instance', () => {
      expect(() =>
        GitHubAnalysis.create(
          AnalysisId.create(uuidv4()),
          UserId.create(uuidv4()),
          RepoURL.create('https://github.com/org/repo'),
          BranchName.create('main'),
          AnalysisStatus.PENDING,
          'not-a-commit-hash',
        ),
      ).toThrow('Invalid commit value');
    });

    it('should throw when analysisId is invalid (inherited validation)', () => {
      expect(() =>
        GitHubAnalysis.create(
          'bad-id',
          UserId.create(uuidv4()),
          RepoURL.create('https://github.com/org/repo'),
          BranchName.create('main'),
          AnalysisStatus.PENDING,
        ),
      ).toThrow('Invalid analysisId value');
    });

    it('should throw when userId is invalid (inherited validation)', () => {
      expect(() =>
        GitHubAnalysis.create(
          AnalysisId.create(uuidv4()),
          'bad-user-id',
          RepoURL.create('https://github.com/org/repo'),
          BranchName.create('main'),
          AnalysisStatus.PENDING,
        ),
      ).toThrow('Invalid userId value');
    });

    it('should throw when status is invalid (inherited validation)', () => {
      expect(() =>
        GitHubAnalysis.create(
          AnalysisId.create(uuidv4()),
          UserId.create(uuidv4()),
          RepoURL.create('https://github.com/org/repo'),
          BranchName.create('main'),
          'UNKNOWN',
        ),
      ).toThrow('Invalid status value');
    });
  });

  // ─── Getters ─────────────────────────────────────────────────────────────────

  describe('getters', () => {
    it('should return the correct analysisId', () => {
      const id = AnalysisId.create(uuidv4());
      const analysis = GitHubAnalysis.create(
        id,
        UserId.create(uuidv4()),
        RepoURL.create('https://github.com/org/repo'),
        BranchName.create('main'),
        AnalysisStatus.PENDING,
      );
      expect(analysis.getAnalysisId()).toBe(id);
    });

    it('should return the correct userId', () => {
      const userId = UserId.create(uuidv4());
      const analysis = GitHubAnalysis.create(
        AnalysisId.create(uuidv4()),
        userId,
        RepoURL.create('https://github.com/org/repo'),
        BranchName.create('main'),
        AnalysisStatus.PENDING,
      );
      expect(analysis.getUserId()).toBe(userId);
    });

    it('should return the correct repoURL', () => {
      const repoURL = RepoURL.create('https://github.com/org/repo');
      const analysis = GitHubAnalysis.create(
        AnalysisId.create(uuidv4()),
        UserId.create(uuidv4()),
        repoURL,
        BranchName.create('main'),
        AnalysisStatus.PENDING,
      );
      expect(analysis.getRepoURL()).toBe(repoURL);
    });

    it('should return the correct branch', () => {
      const branch = BranchName.create('develop');
      const analysis = GitHubAnalysis.create(
        AnalysisId.create(uuidv4()),
        UserId.create(uuidv4()),
        RepoURL.create('https://github.com/org/repo'),
        branch,
        AnalysisStatus.PENDING,
      );
      expect(analysis.getBranch()).toBe(branch);
    });

    it('should return the initial status', () => {
      const analysis = makeValidAnalysis();
      expect(analysis.getStatus()).toBe(AnalysisStatus.PENDING);
    });
  });

  // ─── Status transitions ───────────────────────────────────────────────────

  describe('status transitions', () => {
    it('should transition to IN_PROGRESS', () => {
      const analysis = makeValidAnalysis();
      analysis.in_progress();
      expect(analysis.getStatus()).toBe(AnalysisStatus.IN_PROGRESS);
      expect(() => analysis.in_progress()).toThrow(
        'Analysis can only be set to in progress if it is pending',
      );
    });

    it('should transition to COMPLETED', () => {
      const analysis = makeValidAnalysis();
      analysis.in_progress(); // ← mancava questo
      analysis.complete();
      expect(analysis.getStatus()).toBe(AnalysisStatus.COMPLETED);
      expect(() => analysis.complete()).toThrow(
        'Analysis can only be completed if it is in progress or pending',
      );
    });

    it('should transition to FAILED', () => {
      const analysis = makeValidAnalysis();
      analysis.in_progress(); // ← mancava questo
      analysis.failed();
      expect(analysis.getStatus()).toBe(AnalysisStatus.FAILED);
      expect(() => analysis.failed()).toThrow('Analysis can only be failed if it is in progress');
    });

    it('should transition back to PENDING', () => {
      const analysis = makeValidAnalysis();
      analysis.in_progress();
      analysis.pending();
      expect(analysis.getStatus()).toBe(AnalysisStatus.PENDING);
    });
  });

  // ─── Equality ─────────────────────────────────────────────────────────────

  describe('equals()', () => {
    it('should consider two analyses with the same analysisId as equal', () => {
      const sharedId = AnalysisId.create(uuidv4());
      const a1 = GitHubAnalysis.create(
        sharedId,
        UserId.create(uuidv4()),
        RepoURL.create('https://github.com/org/repo'),
        BranchName.create('main'),
        AnalysisStatus.PENDING,
      );
      const a2 = GitHubAnalysis.create(
        sharedId,
        UserId.create(uuidv4()),
        RepoURL.create('https://github.com/org/other-repo'),
        BranchName.create('develop'),
        AnalysisStatus.COMPLETED,
      );
      expect(a1.equals(a2)).toBe(true);
    });

    it('should consider two analyses with different analysisIds as not equal', () => {
      const a1 = makeValidAnalysis();
      const a2 = makeValidAnalysis();
      expect(a1.equals(a2)).toBe(false);
    });

    it('should return false when comparing with a non-GitHubAnalysis instance', () => {
      const analysis = makeValidAnalysis();
      expect(analysis.equals({})).toBe(false);
      expect(analysis.equals(null)).toBe(false);
    });
  });
});
