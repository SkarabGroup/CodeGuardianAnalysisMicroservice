import { PathFinding } from './path-finding.vo';
import { ErrorFinding } from './error-finding.vo';

export class OWASPFinding {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _errorFinding: ErrorFinding,
    private readonly _owaspCategory: string,
  ) {}

  public equals(other: OWASPFinding): boolean {
    if (!(other instanceof OWASPFinding)) {
      throw new Error('Invalid argument');
    }
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._errorFinding.equals(other._errorFinding) &&
      this._owaspCategory === other._owaspCategory
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

  public static create(
    pathFinding: PathFinding,
    errorFinding: ErrorFinding,
    owaspCategory: string,
  ): OWASPFinding {
    if (!(pathFinding instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (!(errorFinding instanceof ErrorFinding)) {
      throw new Error('Invalid ErrorFinding');
    }

    if (typeof owaspCategory !== 'string') {
      throw new Error('OWASP category must be a string');
    }
    const trimmed = owaspCategory.trim();
    if (!trimmed) {
      throw new Error('OWASP category cannot be empty');
    }
    return new OWASPFinding(pathFinding, errorFinding, trimmed);
  }
}
