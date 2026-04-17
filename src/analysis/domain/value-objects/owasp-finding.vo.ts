import { PathFinding } from './path-finding.vo';
import { ErrorFinding } from './error-finding.vo';

export class OWASPFinding {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _errorFinding: ErrorFinding,
    private readonly _owaspCategory: string,
    private readonly _ruleId: string,
  ) {}

  public equals(other: OWASPFinding): boolean {
    if (!(other instanceof OWASPFinding)) {
      throw new Error('Invalid argument');
    }
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._errorFinding.equals(other._errorFinding) &&
      this._owaspCategory === other._owaspCategory &&
      this._ruleId === other._ruleId
    );
  }

  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public getErrorFinding(): ErrorFinding {
    return this._errorFinding;
  }

  public getOWASPCategory(): string {
    return this._owaspCategory;
  }

  public getRuleId(): string {
    return this._ruleId;
  }

  public static create(
    pathFinding: PathFinding,
    errorFinding: ErrorFinding,
    owaspCategory: string,
    ruleId: string,
  ): OWASPFinding {
    if (!(pathFinding instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (!(errorFinding instanceof ErrorFinding)) {
      throw new Error('Invalid ErrorFinding');
    }

    if (typeof owaspCategory !== 'string' || !owaspCategory.trim()) {
      throw new Error('Owasp category must be a non-empty string');
    }

    if (typeof ruleId !== 'string' || !ruleId.trim()) {
      throw new Error('Rule id must be a non-empty string');
    }
    return new OWASPFinding(pathFinding, errorFinding, owaspCategory.trim(), ruleId.trim());
  }
}
