import { AnalysisId } from '../value-objects/analysis-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { AnalysisStatus } from '../enums/analysis-status.enum';

export abstract class Analysis {
  private readonly analysisId: AnalysisId;
  private readonly userId: UserId;
  private status: AnalysisStatus;

  protected constructor(user: UserId) {
    this.analysisId = AnalysisId.create();
    this.userId = user;
    this.status = AnalysisStatus.PENDING;
  }

  public complete() {
    if (this.status === AnalysisStatus.IN_PROGRESS) {
      this.status = AnalysisStatus.COMPLETED;
    } else {
      throw new Error('Analysis can only be completed if it is in progress');
    }
  }

  public inProgress() {
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
