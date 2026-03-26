export class CommitHash {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  public static create(value: string): CommitHash {
    if (typeof value !== 'string') {
      throw new Error('Commit hash must be a string');
    }
    if (!value || value.trim() === '') {
      throw new Error('Commit hash cannot be empty');
    }
    return new CommitHash(value);
  }

  private validate(value: string): void {
    const hexRegex = /^[0-9a-fA-F]{40}$/;
    if (!hexRegex.test(value)) {
      throw new Error('Invalid commit hash format');
    }
  }

  public equals(other: CommitHash): boolean {
    if (!(other instanceof CommitHash) || other === null) {
      throw new Error('Invalid argument');
    }
    return this._value === other._value;
  }
}
