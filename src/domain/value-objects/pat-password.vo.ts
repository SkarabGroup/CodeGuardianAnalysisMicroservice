export class PATPassword {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: string) {
    const SHA256_REGEX = /^[a-f0-9]{64}$/i;
    if (!SHA256_REGEX.test(value)) {
      throw new Error('Must be a SHA-256 formatted string');
    }
  }

  public get value(): string {
    return this._value;
  }

  public static create(value: string): PATPassword {
    return new PATPassword(value);
  }
}
