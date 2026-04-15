import { SeverityLevel } from '../enums/severity-level.enum';

const SEVERITY_ALIASES: Record<string, SeverityLevel> = {
  LOW: SeverityLevel.LOW,
  INFO: SeverityLevel.LOW,
  HINT: SeverityLevel.LOW,
  MEDIUM: SeverityLevel.MEDIUM,
  WARNING: SeverityLevel.MEDIUM,
  HIGH: SeverityLevel.HIGH,
  ERROR: SeverityLevel.HIGH,
  CRITICAL: SeverityLevel.CRITICAL,
  FATAL: SeverityLevel.CRITICAL,
};

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

    const resolvedSeverity = SEVERITY_ALIASES[normalized] || SeverityLevel.MEDIUM;

    return new SeverityFinding(resolvedSeverity);
  }

  private validate(value: string): void {
    if (!Object.values(SeverityLevel).includes(value as SeverityLevel)) {
      throw new Error(`Invalid severity level: ${value}`);
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
