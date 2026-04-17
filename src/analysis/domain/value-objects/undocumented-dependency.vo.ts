import { PathFinding } from './path-finding.vo';

export class UndocumentedDependency {
  private constructor(
    private readonly _name: string,
    private readonly _pathFinding: PathFinding,
  ) {}

  public equals(other: UndocumentedDependency): boolean {
    if (!(other instanceof UndocumentedDependency)) {
      throw new Error('Invalid argument');
    }
    return this._name === other._name && this._pathFinding.equals(other._pathFinding);
  }

  public getName(): string {
    return this._name;
  }
  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public static create(name: string, path: PathFinding): UndocumentedDependency {
    if (typeof name !== 'string' || !name.trim())
      throw new Error('Name must be a non-empty string');
    if (!(path instanceof PathFinding)) throw new Error('Invalid PathFinding');
    return new UndocumentedDependency(name.trim(), path);
  }
}
