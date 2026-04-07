export class CoveragePercentage {
  private readonly _value: number;

  private constructor(value: number) {
    this._validate(value);
    this._value = value;
  }

  private _validate(value: number): void {
    if (value < 0 || value > 1 || !Number.isFinite(value)) {
      throw new Error('Coverage percentage must be a number between 0 and 1');
    }
  }

  public equals(other: CoveragePercentage): boolean {
    if (!(other instanceof CoveragePercentage)) {
      throw new Error('Invalid argument');
    }
    return this._value === other._value;
  }

  public get value(): number {
    return this._value;
  }

  public static create(value: number): CoveragePercentage {
    if (typeof value !== 'number') {
      throw new Error('Coverage percentage must be a number');
    }
    return new CoveragePercentage(value);
  }
}
