export class ReadmeDependency {
  private constructor(
    private readonly _name: string,
    private readonly _versionClaimed: string | null,
  ) {}

  public equals(other: ReadmeDependency): boolean {
    if (!(other instanceof ReadmeDependency)) {
      throw new Error('Invalid argument');
    }
    return this._name === other._name && this._versionClaimed === other._versionClaimed;
  }

  public getName(): string {
    return this._name;
  }
  public getVersionClaimed(): string | null {
    return this._versionClaimed;
  }

  public static create(name: string, versionClaimed: string | null): ReadmeDependency {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('Name must be a non-empty string');
    }
    return new ReadmeDependency(name.trim(), versionClaimed?.trim() ?? null);
  }
}
