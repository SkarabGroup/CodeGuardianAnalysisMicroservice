import { v4 as uuid } from 'uuid';

export class AnalysisId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(): AnalysisId {
    return new AnalysisId(uuid());
  }

  public equals(other: AnalysisId): boolean {
    if (!(other instanceof AnalysisId) || other === null) return false;
    return this._value === other._value;
  }
}
