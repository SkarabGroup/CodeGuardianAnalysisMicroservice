import { AnalysisId } from '../value-objects/analysis-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export enum AnalysisStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export abstract class Analysis {
  private readonly analysisId: AnalysisId;
  private status: AnalysisStatus;
  private readonly userId: UserId;

  protected constructor(id: AnalysisId, userId: UserId, status: AnalysisStatus) {
    this.validateAnalysisId(id);
    this.validateUserId(userId);
    this.validateStatus(status);
    this.analysisId = id;
    this.userId = userId;
    this.status = status;
  }

  private validateStatus(status: AnalysisStatus): void {
    if (!Object.values(AnalysisStatus).includes(status)) {
      throw new Error('Invalid status value');
    }
  }

  private validateUserId(userId: UserId): void {
    if (!(userId instanceof UserId)) {
      throw new Error('Invalid userId value');
    }
  }

  private validateAnalysisId(analysisId: AnalysisId): void {
    if (!(analysisId instanceof AnalysisId)) {
      throw new Error('Invalid analysisId value');
    }
  }

  public complete() {
    if (this.status === AnalysisStatus.IN_PROGRESS) {
      this.status = AnalysisStatus.COMPLETED;
    } else {
      throw new Error('Analysis can only be completed if it is in progress or pending');
    }
  }

  public in_progress() {
    if (this.status === AnalysisStatus.PENDING) {
      this.status = AnalysisStatus.IN_PROGRESS;
    } else {
      throw new Error('Analysis can only be set to in progress if it is pending');
    }
  }

  public failed() {
    if (this.status === AnalysisStatus.IN_PROGRESS) {
      this.status = AnalysisStatus.FAILED;
    } else {
      throw new Error('Analysis can only be failed if it is in progress');
    }
  }

  public pending() {
    this.status = AnalysisStatus.PENDING;
  }

  public getAnalysisId(): AnalysisId {
    return this.analysisId;
  }

  public getUserId(): UserId {
    return this.userId;
  }

  public getStatus(): AnalysisStatus {
    return this.status;
  }

  public equals(other: Analysis): boolean {
    return other instanceof Analysis && this.analysisId.equals(other.analysisId);
  }
}
