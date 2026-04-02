import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { UserId } from '../../../src/domain/value-objects/user-id.vo';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../src/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../src/domain/value-objects/commit-hash.vo';
import { AnalysisStatus } from '../../../src/domain/enums/analysis-status.enum';
import { AnalysisId } from '../../../src/domain/value-objects/analysis-id.vo';
import { v7 as uuid } from 'uuid';

describe('GitHubAnalysis Entity', () => {
  describe('Success Cases', () => {
    // 1. Corretta l'inizializzazione con AnalysisId.create e UserId.create
    const noCommit = GitHubAnalysis.create(
      AnalysisId.create(uuid()),
      UserId.create(uuid()),
      RepoURL.create('https://github.com/SkarabGroup/CodeGuardianAnalysisMicroservice.git'),
      BranchName.create('main'),
      null,
    );

    const withCommit = GitHubAnalysis.create(
      AnalysisId.create(uuid()),
      UserId.create(uuid()),
      RepoURL.create('https://github.com/SkarabGroup/CodeGuardianAnalysisMicroservice.git'),
      null,
      CommitHash.create('561104ff6dbfbb3ea2b7af30407403cc22c61325'),
    );

    it('Should create a valid instance without a commit', () => {
      expect(noCommit).toBeInstanceOf(GitHubAnalysis);
    });

    it('Should create a valid instance with a commit', () => {
      expect(withCommit).toBeInstanceOf(GitHubAnalysis);
    });

    it('Should create a standard GitHubAnalysis', () => {
      const test = GitHubAnalysis.create(
        AnalysisId.create(uuid()),
        UserId.create(uuid()),
        RepoURL.create('https://github.com/SkarabGroup/CodeGuardianAnalysisMicroservice.git'),
        null,
        null,
      );

      expect(test).toBeInstanceOf(GitHubAnalysis);

      expect(test.getBranch()?.value).toBe('main');
    });

    it('should be initialized with PENDING status', () => {
      expect(withCommit.getStatus()).toBe(AnalysisStatus.PENDING);
      expect(noCommit.getStatus()).toBe(AnalysisStatus.PENDING);
    });

    it('should change status to IN_PROGRESS', () => {
      withCommit.inProgress();
      noCommit.inProgress();
      expect(noCommit.getStatus()).toBe(AnalysisStatus.IN_PROGRESS);
      expect(withCommit.getStatus()).toBe(AnalysisStatus.IN_PROGRESS);
    });

    it('should throw error when changing to IN_PROGRESS if not PENDING', () => {
      withCommit.pending();
      withCommit.inProgress();
      noCommit.pending();
      noCommit.inProgress();
      expect(() => withCommit.inProgress()).toThrow(
        'Analysis can only be set to in progress if it is pending',
      );
      expect(() => noCommit.inProgress()).toThrow(
        'Analysis can only be set to in progress if it is pending',
      );
    });

    it('should change status to COMPLETED from IN_PROGRESS', () => {
      withCommit.pending();
      noCommit.pending();

      noCommit.inProgress();
      noCommit.complete();
      withCommit.inProgress();
      withCommit.complete();
      expect(noCommit.getStatus()).toBe(AnalysisStatus.COMPLETED);
      expect(withCommit.getStatus()).toBe(AnalysisStatus.COMPLETED);
    });

    it('should throw error when completing if not IN_PROGRESS', () => {
      expect(() => noCommit.complete()).toThrow(
        'Analysis can only be completed if it is in progress',
      );
      expect(() => withCommit.complete()).toThrow(
        'Analysis can only be completed if it is in progress',
      );
    });

    it('should fail correctly from IN_PROGRESS', () => {
      withCommit.pending();
      noCommit.pending();

      noCommit.inProgress();
      noCommit.failed();
      expect(noCommit.getStatus()).toBe(AnalysisStatus.FAILED);

      withCommit.inProgress();
      withCommit.failed();
      expect(withCommit.getStatus()).toBe(AnalysisStatus.FAILED);
    });

    it('should throw error when failing if COMPLETED', () => {
      withCommit.pending();
      noCommit.pending();

      noCommit.inProgress();
      noCommit.complete();
      expect(() => noCommit.failed()).toThrow('Analysis can only be failed if it is in progress');

      withCommit.inProgress();
      withCommit.complete();
      expect(() => withCommit.failed()).toThrow('Analysis can only be failed if it is in progress');
    });

    it('should return PENDING status', () => {
      withCommit.pending();
      noCommit.pending();

      noCommit.inProgress();
      noCommit.pending();
      expect(noCommit.getStatus()).toBe(AnalysisStatus.PENDING);

      withCommit.inProgress();
      withCommit.pending();
      expect(withCommit.getStatus()).toBe(AnalysisStatus.PENDING);
    });

    it('should return error', () => {
      expect(() => withCommit.complete()).toThrow(
        'Analysis can only be completed if it is in progress',
      );
      expect(() => noCommit.complete()).toThrow(
        'Analysis can only be completed if it is in progress',
      );
    });

    it('should verify equality between two analysis with same ID', () => {
      expect(noCommit.equals(noCommit)).toBe(true);
    });

    it('should return the userId', () => {
      expect(noCommit.getUserId()).toBeInstanceOf(UserId);
      expect(withCommit.getUserId()).toBeInstanceOf(UserId);
    });

    it('should return the analysisId', () => {
      // 2. Corretto usando toBeInstanceOf invece di toBe
      expect(noCommit.getAnalysisId()).toBeInstanceOf(AnalysisId);
      expect(withCommit.getAnalysisId()).toBeInstanceOf(AnalysisId);
    });

    it('should return null if used getCommit() on null commit', () => {
      expect(noCommit).toBeInstanceOf(GitHubAnalysis);
      expect(noCommit.getCommit()).toBeNull();
    });

    it('should return a CommitHash if used getCommit() on commit', () => {
      expect(withCommit).toBeInstanceOf(GitHubAnalysis);
      expect(withCommit.getCommit()).toBeInstanceOf(CommitHash);
    });

    it('should return the branch on no commit', () => {
      expect(noCommit.getBranch()).toBeInstanceOf(BranchName);
    });

    // 3. Corretto il test per aspettarsi null, dato che withCommit ha il branch a null
    it('should return null on getBranch() when initialized with commit only', () => {
      expect(withCommit.getBranch()).toBeNull();
    });

    it('should return the correct repoURL', () => {
      expect(noCommit.getRepoURL()).toBeInstanceOf(RepoURL);
      expect(withCommit.getRepoURL()).toBeInstanceOf(RepoURL);
    });
  });
});
