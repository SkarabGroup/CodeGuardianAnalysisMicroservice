import { GitHubAnalysisMapper } from '../../../src/application/mappers/github-analysis.model.mapper';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { GitHubAnalysisModel } from '../../../src/application/DTOs/models/github-analysis.model';
import { AnalysisStatus } from '../../../src/domain/entities/analysis.entity';
import { AnalysisId } from '../../../src/domain/value-objects/analysis-id.vo';
import { UserId } from '../../../src/domain/value-objects/user-id.vo';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../src/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../src/domain/value-objects/commit-hash.vo';
import { v4 as uuidv4 } from 'uuid';

const VALID_ID = uuidv4();
const VALID_USER = uuidv4();
const VALID_REPO = 'https://github.com/org/repo';
const VALID_BRANCH = 'main';
const VALID_COMMIT = 'a'.repeat(40);

const makeEntity = (commit?: CommitHash) =>
  GitHubAnalysis.create(
    AnalysisId.create(VALID_ID),
    UserId.create(VALID_USER),
    RepoURL.create(VALID_REPO),
    BranchName.create(VALID_BRANCH),
    AnalysisStatus.PENDING,
    commit,
  );

describe('GitHubAnalysisMapper', () => {
  // ─── Output type ──────────────────────────────────────────────────────────

  describe('toModel()', () => {
    it('should return a GitHubAnalysisModel instance', () => {
      const model = GitHubAnalysisMapper.toModel(makeEntity());
      expect(model).toBeInstanceOf(GitHubAnalysisModel);
    });

    // ─── Primitive mapping ─────────────────────────────────────────────────

    it('should map id correctly', () => {
      const model = GitHubAnalysisMapper.toModel(makeEntity());
      expect(model.id).toBe(VALID_ID);
    });

    it('should map userId correctly', () => {
      const model = GitHubAnalysisMapper.toModel(makeEntity());
      expect(model.userId).toBe(VALID_USER);
    });

    it('should map status correctly', () => {
      const model = GitHubAnalysisMapper.toModel(makeEntity());
      expect(model.status).toBe(AnalysisStatus.PENDING);
    });

    it('should map repoURL correctly', () => {
      const model = GitHubAnalysisMapper.toModel(makeEntity());
      expect(model.repoURL).toBe(VALID_REPO);
    });

    it('should map branch correctly', () => {
      const model = GitHubAnalysisMapper.toModel(makeEntity());
      expect(model.branch).toBe(VALID_BRANCH);
    });

    // ─── Commit ────────────────────────────────────────────────────────────

    it('should map commit to null when not provided', () => {
      const model = GitHubAnalysisMapper.toModel(makeEntity());
      expect(model.commit).toBeNull();
    });

    it('should map commit correctly when provided', () => {
      const commit = CommitHash.create(VALID_COMMIT);
      const model = GitHubAnalysisMapper.toModel(makeEntity(commit));
      expect(model.commit).toBe(VALID_COMMIT);
    });

    // ─── No domain leakage ────────────────────────────────────────────────

    it('should return only primitives — no value object instances', () => {
      const commit = CommitHash.create(VALID_COMMIT);
      const model = GitHubAnalysisMapper.toModel(makeEntity(commit));

      expect(typeof model.id).toBe('string');
      expect(typeof model.userId).toBe('string');
      expect(typeof model.status).toBe('string');
      expect(typeof model.repoURL).toBe('string');
      expect(typeof model.branch).toBe('string');
      expect(typeof model.commit).toBe('string');
    });

    // ─── Status variants ──────────────────────────────────────────────────

    it.each([
      AnalysisStatus.PENDING,
      AnalysisStatus.IN_PROGRESS,
      AnalysisStatus.COMPLETED,
      AnalysisStatus.FAILED,
    ])('should map status "%s" correctly', (status) => {
      const entity = GitHubAnalysis.create(
        AnalysisId.create(uuidv4()),
        UserId.create(uuidv4()),
        RepoURL.create(VALID_REPO),
        BranchName.create(VALID_BRANCH),
        status,
      );
      expect(GitHubAnalysisMapper.toModel(entity).status).toBe(status);
    });
  });
});
