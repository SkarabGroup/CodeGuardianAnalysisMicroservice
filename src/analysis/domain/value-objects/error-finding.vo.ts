import { DescriptionFinding } from './description-finding.vo';
import { SeverityFinding } from './severity-finding.vo';

export class ErrorFinding {
  private readonly _errorLine: number;
  private readonly _description: DescriptionFinding;
  private readonly _severity: SeverityFinding;

  private constructor(line: number, description: DescriptionFinding, severity: SeverityFinding) {
    this.validate(line);
    this._errorLine = line;
    this._description = description;
    this._severity = severity;
  }

  public static create(
    line: number,
    description: DescriptionFinding,
    severity: SeverityFinding,
  ): ErrorFinding {
    if (typeof line !== 'number') {
      throw new Error('Line must be a number');
    }

    if (!(description instanceof DescriptionFinding)) {
      throw new Error('Invalid DescriptionFinding');
    }

    if (!(severity instanceof SeverityFinding)) {
      throw new Error('Invalid SeverityFinding');
    }

    return new ErrorFinding(line, description, severity);
  }

  private validate(line: number): void {
    if (!Number.isInteger(line)) {
      throw new Error('Line must be an integer');
    }

    if (line <= 0) {
      throw new Error('Line must be a positive number');
    }
  }

  public get errorLine(): number {
    return this._errorLine;
  }

  public get description(): DescriptionFinding {
    return this._description;
  }

  public get severity(): SeverityFinding {
    return this._severity;
  }

  public equals(other: ErrorFinding): boolean {
    if (!(other instanceof ErrorFinding)) {
      throw new Error('Invalid argument');
    }

    return (
      this._errorLine === other._errorLine &&
      this._description.equals(other._description) &&
      this._severity.equals(other._severity)
    );
  }
}
