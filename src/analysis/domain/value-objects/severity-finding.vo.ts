import { SeverityLevel } from '../enums/severity-level.enum';

export class SeverityFinding {
  private readonly _value: SeverityLevel;

  private constructor(value: SeverityLevel) {
    this.validate(value);
    this._value = value;
  }

  public static create(value: string): SeverityFinding {
    if (typeof value !== 'string') {
      throw new Error('Severity must be a string');
    }

    const normalized = value.trim().toUpperCase();

    if (!normalized) {
      throw new Error('Severity cannot be empty');
    }

    return new SeverityFinding(normalized as SeverityLevel);
  }

  private validate(value: string): void {
    if (!Object.values(SeverityLevel).includes(value as SeverityLevel)) {
      throw new Error('Invalid severity level');
    }
  }

  public get value(): SeverityLevel {
    return this._value;
  }

  public equals(other: SeverityFinding): boolean {
    if (!(other instanceof SeverityFinding)) {
      throw new Error('Invalid argument');
    }
    return this._value === other._value;
  }
}
