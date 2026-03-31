export class AnalysisId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: string): void {
    const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_V7_REGEX.test(value)) {
      throw new Error('Must be passed a valid UUID');
    }
  }

  public static create(value: string): AnalysisId {
    return new AnalysisId(value);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: AnalysisId): boolean {
    if (!(other instanceof AnalysisId) || other === null) return false;
    return this._value === other._value;
  }
}
