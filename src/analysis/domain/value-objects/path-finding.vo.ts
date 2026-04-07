export class PathFinding {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  public static create(value: string): PathFinding {
    if (typeof value !== 'string') {
      throw new Error('Path must be a string');
    }

    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error('Path cannot be empty');
    }

    return new PathFinding(trimmed);
  }

  private validate(value: string): void {
    if (value.startsWith('/')) {
      throw new Error('Path must be relative');
    }

    if (value.includes('\\')) {
      throw new Error('Path must not contain "\\". Use "/" separators');
    }

    if (value.includes('..')) {
      throw new Error('Path cannot contain ".."');
    }
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: PathFinding): boolean {
    if (!(other instanceof PathFinding)) {
      throw new Error('Invalid argument');
    }
    return this._value === other._value;
  }
}
