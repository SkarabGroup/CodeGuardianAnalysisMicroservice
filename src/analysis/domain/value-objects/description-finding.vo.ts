export class DescriptionFinding {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): DescriptionFinding {
    if (typeof value !== 'string') {
      throw new Error('Description must be a string');
    }

    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error('Description cannot be empty');
    }

    return new DescriptionFinding(trimmed);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: DescriptionFinding): boolean {
    if (!(other instanceof DescriptionFinding)) {
      throw new Error('Invalid argument');
    }
    return this._value === other._value;
  }
}
