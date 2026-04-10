import { PathFinding } from './path-finding.vo';

export class ConfigDependency {
  private constructor(
    private readonly _name: string,
    private readonly _versionPinned: string | null,
    private readonly _pathFinding: PathFinding,
  ) {}

  public equals(other: ConfigDependency): boolean {
    if (!(other instanceof ConfigDependency)) {
      throw new Error('Invalid argument');
    }
    return (
      this._name === other._name &&
      this._versionPinned === other._versionPinned &&
      this._pathFinding.equals(other._pathFinding)
    );
  }

  public getName(): string {
    return this._name;
  }
  public getVersionPinned(): string | null {
    return this._versionPinned;
  }
  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public static create(
    name: string,
    versionPinned: string | null,
    pathFinding: PathFinding,
  ): ConfigDependency {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('Name must be a non-empty string');
    }
    if (!(pathFinding instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }
    return new ConfigDependency(name.trim(), versionPinned?.trim() ?? null, pathFinding);
  }
}
