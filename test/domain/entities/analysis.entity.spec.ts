import { UserId } from '../../../src/domain/value-objects/user-id.vo';
import { AnalysisId } from '../../../src/domain/value-objects/analysis-id.vo';
import { Analysis } from '../../../src/domain/entities/analysis.entity';
import { AnalysisStatus } from '../../../src/domain/enums/analysis-status.enum';
import { v4 as uuid } from 'uuid';

class TestAnalysis extends Analysis {
  constructor(user: UserId) {
    super(user);
  }
}

describe('Analysis Entity', () => {
  let userId: UserId;

  beforeEach(() => {
    userId = UserId.create(uuid());
  });

  it('Should create a valid Analysis Entity instance', () => {
    expect(new TestAnalysis(userId)).toBeInstanceOf(TestAnalysis);
  });

  it('should be initialized with PENDING status', () => {
    const analysis = new TestAnalysis(userId);
    expect(analysis.getStatus()).toBe(AnalysisStatus.PENDING);
  });

  it('should change status to IN_PROGRESS', () => {
    const analysis = new TestAnalysis(userId);
    analysis.inProgress();
    expect(analysis.getStatus()).toBe(AnalysisStatus.IN_PROGRESS);
  });

  it('should throw error when changing to IN_PROGRESS if not PENDING', () => {
    const analysis = new TestAnalysis(userId);
    analysis.inProgress();
    expect(() => analysis.inProgress()).toThrow(
      'Analysis can only be set to in progress if it is pending',
    );
  });

  it('should change status to COMPLETED from IN_PROGRESS', () => {
    const analysis = new TestAnalysis(userId);
    analysis.inProgress();
    analysis.complete();
    expect(analysis.getStatus()).toBe(AnalysisStatus.COMPLETED);
  });

  it('should throw error when completing if not IN_PROGRESS', () => {
    const analysis = new TestAnalysis(userId);
    expect(() => analysis.complete()).toThrow(
      'Analysis can only be completed if it is in progress',
    );
  });

  it('should fail correctly from IN_PROGRESS', () => {
    const analysis = new TestAnalysis(userId);
    analysis.inProgress();
    analysis.failed();
    expect(analysis.getStatus()).toBe(AnalysisStatus.FAILED);
  });

  it('should throw error when failing if COMPLETED', () => {
    const analysis = new TestAnalysis(userId);
    analysis.inProgress();
    analysis.complete();
    expect(() => analysis.failed()).toThrow('Analysis can only be failed if it is in progress');
  });

  it('should return PENDING status', () => {
    const analysis = new TestAnalysis(userId);
    analysis.inProgress();
    analysis.pending();
    expect(analysis.getStatus()).toBe(AnalysisStatus.PENDING);
  });

  it('should verify equality between two analysis with same ID', () => {
    const analysis = new TestAnalysis(userId);
    expect(analysis.equals(analysis)).toBe(true);
  });

  it('should return the userId', () => {
    const analysis = new TestAnalysis(userId);
    expect(analysis.getUserId()).toBeInstanceOf(UserId);
  });

  it('should return the analysisId', () => {
    const analysis = new TestAnalysis(userId);
    expect(analysis.getAnalysisId()).toBeInstanceOf(AnalysisId);
  });
});
