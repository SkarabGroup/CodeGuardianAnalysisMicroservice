import { validate as uuidValidate } from 'uuid';

export class AnalysisId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  public static create(value: string): AnalysisId {
    if (typeof value !== 'string') {
      throw new Error('AnalysisId must be a string');
    }
    return new AnalysisId(value);
  }

  private validate(value: string): void {
    if (!uuidValidate(value)) {
      throw new Error('Invalid UUID format for AnalysisId : ' + value);
    }
  }

  public equals(other: AnalysisId): boolean {
    if (!(other instanceof AnalysisId) || other === null) return false;
    return this._value === other._value;
  }

  public getValue(): string {
    return this._value;
  }
}
