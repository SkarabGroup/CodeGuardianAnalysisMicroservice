import {
  GitHubAnalysis,
  GitHubAnalysisProps,
} from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { UserId } from '../../../../src/analysis/domain/value-objects/user-id.vo';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../../src/analysis/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { AnalysisStatus } from '../../../../src/analysis/domain/enums/analysis-status.enum';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { v7 as uuid } from 'uuid';

describe('GitHubAnalysis Entity', () => {
  const properties: GitHubAnalysisProps = {
    id: AnalysisId.create(uuid()),
    user: UserId.create(uuid()),
    url: RepoURL.create('https://github.com/valid-url/repo'),
    branch: BranchName.create('feature/github-analysis'),
    commit: CommitHash.create('561104ff6dbfbb3ea2b7af30407403cc22c61325'),
  };

  describe('Creation', () => {
    it('should be created in PENDING status with the provided properties and null report ids', () => {
      const analysis = GitHubAnalysis.create(properties);

      expect(analysis.getAnalysisId()).toBeInstanceOf(AnalysisId);
      expect(analysis.getUserId()).toBeInstanceOf(UserId);
      expect(analysis.getRepoURL()).toBeInstanceOf(RepoURL);
      expect(analysis.getBranch()).toBeInstanceOf(BranchName);
      expect(analysis.getCommit()).toBeInstanceOf(CommitHash);

      expect(analysis.getAnalysisId().value).toBe(properties.id.value);
      expect(analysis.getUserId().value).toBe(properties.user.value);
      expect(analysis.getRepoURL().value).toBe(properties.url.value);
      expect(analysis.getBranch().value).toBe(properties.branch.value);
      expect(analysis.getCommit().value).toBe(properties.commit.value);

      expect(analysis.getStatus()).toBe(AnalysisStatus.PENDING);

      expect(analysis.getCodeReportId()).toBeNull();
      expect(analysis.getDocsReportId()).toBeNull();
      expect(analysis.getSecurityReportId()).toBeNull();
    });

    it('should correctly set report IDs when provided', () => {
      const codeReportId = ReportId.create(uuid());
      const docsReportId = ReportId.create(uuid());
      const securityReportId = ReportId.create(uuid());

      const analysisWithReports = GitHubAnalysis.create({
        ...properties,
        codeReportId,
        docsReportId,
        securityReportId,
      });

      expect(analysisWithReports.getCodeReportId()).toBe(codeReportId);
      expect(analysisWithReports.getDocsReportId()).toBe(docsReportId);
      expect(analysisWithReports.getSecurityReportId()).toBe(securityReportId);
    });
  });

  describe('StateMachine', () => {
    it('should set status to IN_PROGRESS from PENDING', () => {
      const analysis = GitHubAnalysis.create(properties);
      analysis.inProgress();
      expect(analysis.getStatus()).toBe(AnalysisStatus.IN_PROGRESS);
    });

    it('should set status to COMPLETED from IN_PROGRESS', () => {
      const analysis = GitHubAnalysis.create(properties);
      analysis.inProgress();
      analysis.complete();
      expect(analysis.getStatus()).toBe(AnalysisStatus.COMPLETED);
    });

    it('should set status to FAILED from IN_PROGRESS', () => {
      const analysis = GitHubAnalysis.create(properties);
      analysis.inProgress();
      analysis.failed();
      expect(analysis.getStatus()).toBe(AnalysisStatus.FAILED);
    });

    it('should allow resetting to PENDING from any state', () => {
      const analysis = GitHubAnalysis.create(properties);
      analysis.inProgress();
      analysis.complete();
      analysis.pending();
      expect(analysis.getStatus()).toBe(AnalysisStatus.PENDING);
    });

    it('should throw error when completing directly from PENDING', () => {
      const analysis = GitHubAnalysis.create(properties);
      expect(() => analysis.complete()).toThrow(
        'Analysis can only be completed if it is in progress',
      );
    });

    it('should throw error when failing directly from PENDING', () => {
      const analysis = GitHubAnalysis.create(properties);
      expect(() => analysis.failed()).toThrow('Analysis can only be failed if it is in progress');
    });

    it('should throw error when setting IN_PROGRESS if already COMPLETED', () => {
      const analysis = GitHubAnalysis.create(properties);
      analysis.inProgress();
      analysis.complete();
      expect(() => analysis.inProgress()).toThrow(
        'Analysis can only be set to in progress if it is pending',
      );
    });

    it('should throw error when setting IN_PROGRESS if already FAILED', () => {
      const analysis = GitHubAnalysis.create(properties);
      analysis.inProgress();
      analysis.failed();
      expect(() => analysis.inProgress()).toThrow(
        'Analysis can only be set to in progress if it is pending',
      );
    });
  });

  describe('Equality', () => {
    it('should return true if entities are equals', () => {
      const analysis = GitHubAnalysis.create(properties);
      const second = GitHubAnalysis.create(properties);
      expect(analysis.equals(second)).toBe(true);
    });
  });
});
