import { PathFinding } from './path-finding.vo';

export class VersionMismatchDependency {
  private constructor(
    private readonly _name: string,
    private readonly _readmeVersion: string,
    private readonly _configVersion: string,
    private readonly _pathFinding: PathFinding,
  ) {}

  public equals(other: VersionMismatchDependency): boolean {
    if (!(other instanceof VersionMismatchDependency)) {
      throw new Error('Invalid argument');
    }
    return (
      this._name === other._name &&
      this._readmeVersion === other._readmeVersion &&
      this._configVersion === other._configVersion &&
      this._pathFinding.equals(other._pathFinding)
    );
  }

  public getName(): string {
    return this._name;
  }
  public getReadmeVersion(): string {
    return this._readmeVersion;
  }
  public getConfigVersion(): string {
    return this._configVersion;
  }
  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public static create(
    name: string,
    readmeVersion: string,
    configVersion: string,
    path: PathFinding,
  ): VersionMismatchDependency {
    if (typeof name !== 'string' || !name.trim())
      throw new Error('Name must be a non-empty string');
    if (typeof readmeVersion !== 'string' || !readmeVersion.trim())
      throw new Error('readmeVersion must be a non-empty string');
    if (typeof configVersion !== 'string' || !configVersion.trim())
      throw new Error('configVersion must be a non-empty string');
    if (!(path instanceof PathFinding)) throw new Error('Invalid PathFinding');
    return new VersionMismatchDependency(
      name.trim(),
      readmeVersion.trim(),
      configVersion.trim(),
      path,
    );
  }
}
