import { SeverityFinding } from './severity-finding.vo';
import { PathFinding } from './path-finding.vo';

export class MissingInConfigDependency {
  private constructor(
    private readonly _name: string,
    private readonly _pathFinding: PathFinding,
    private readonly _severity: SeverityFinding,
  ) {}

  public equals(other: MissingInConfigDependency): boolean {
    if (!(other instanceof MissingInConfigDependency)) {
      throw new Error('Invalid argument');
    }
    return (
      this._name === other._name &&
      this._pathFinding.equals(other._pathFinding) &&
      this._severity.equals(other._severity)
    );
  }

  public getName(): string {
    return this._name;
  }
  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }
  public getSeverityFinding(): SeverityFinding {
    return this._severity;
  }

  public static create(
    name: string,
    pathFinding: PathFinding,
    severity: SeverityFinding,
  ): MissingInConfigDependency {
    if (typeof name !== 'string' || !name.trim())
      throw new Error('Name must be a non-empty string');
    if (!(pathFinding instanceof PathFinding)) throw new Error('Invalid PathFinding');
    if (!(severity instanceof SeverityFinding)) throw new Error('Invalid SeverityFinding');
    return new MissingInConfigDependency(name.trim(), pathFinding, severity);
  }
}
