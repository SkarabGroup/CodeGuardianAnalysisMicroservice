import { PathFinding } from './path-finding.vo';
import { ErrorFinding } from './error-finding.vo';
import { DescriptionFinding } from './description-finding.vo';

export class SecretFinding {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _errorFinding: ErrorFinding,
    private readonly _secretCategory: string,
    private readonly _ruleId: string,
    private readonly _remediation: DescriptionFinding,
  ) {}

  public equals(other: SecretFinding): boolean {
    if (!(other instanceof SecretFinding)) {
      throw new Error('Invalid argument');
    }
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._errorFinding.equals(other._errorFinding) &&
      this._secretCategory === other._secretCategory &&
      this._ruleId === other._ruleId && 
      this._remediation.equals(other._remediation)
    );
  }

  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public getErrorFinding(): ErrorFinding {
    return this._errorFinding;
  }

  public getSecretCategory(): string {
    return this._secretCategory;
  }

  public getRuleId(): string {
    return this._ruleId;
  }

  public getRemediation(): DescriptionFinding {
    return this._remediation;
  }

  public static create(
    pathFinding: PathFinding,
    errorFinding: ErrorFinding,
    secretCategory: string,
    ruleId: string,
    remediation: DescriptionFinding
  ): SecretFinding {
    if (!(pathFinding instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (!(errorFinding instanceof ErrorFinding)) {
      throw new Error('Invalid ErrorFinding');
    }

    if (typeof secretCategory !== 'string' || !secretCategory.trim()) {
      throw new Error('Secret category must be a non-empty string');
    }

    if (typeof ruleId !== 'string' || !ruleId.trim()) {
      throw new Error('Rule id must be a non-empty string');
    }

    if (!(remediation instanceof DescriptionFinding)) {
      throw new Error('Invalid DescriptionFinding');
    }
    return new SecretFinding(pathFinding, errorFinding, secretCategory.trim(), ruleId.trim(), remediation);
  }
}
