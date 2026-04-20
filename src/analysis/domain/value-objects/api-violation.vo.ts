import { DescriptionFinding } from './description-finding.vo';
import { PathFinding } from './path-finding.vo';
import { SeverityFinding } from './severity-finding.vo';

export class APIViolation {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _rule: string,
    private readonly _severity: SeverityFinding,
    private readonly _description: DescriptionFinding,
  ) {}

  public equals(other: APIViolation): boolean {
    if (!(other instanceof APIViolation)) {
      throw new Error('Invalid argument');
    }
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._severity.equals(other._severity) &&
      this._rule === other._rule &&
      this._description.equals(other._description)
    );
  }

  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public getRule(): string {
    return this._rule;
  }

  public getSeverityFinding(): SeverityFinding {
    return this._severity;
  }

  public getDescriptionFinding(): DescriptionFinding {
    return this._description;
  }

  public static create(
    path: PathFinding,
    rule: string,
    severity: SeverityFinding,
    description: DescriptionFinding,
  ): APIViolation {
    if (!(path instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (typeof rule !== 'string' || !rule.trim()) {
      throw new Error('Rule must be a non-empty string');
    }

    if (!(severity instanceof SeverityFinding)) {
      throw new Error('Invalid SeverityFinding');
    }

    if (!(description instanceof DescriptionFinding)) {
      throw new Error('Invalid DescriptionFinding');
    }

    return new APIViolation(path, rule.trim(), severity, description);
  }
}
