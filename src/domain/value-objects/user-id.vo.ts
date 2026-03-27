import { validate as uuidValidate } from 'uuid';

export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  public static create(value: string): UserId {
    return new UserId(value);
  }

  private validate(value: string): void {
    if (!uuidValidate(value)) {
      throw new Error('Invalid UUID format for UserId : ' + value);
    }
  }

  public equals(other: UserId): boolean {
    if (!(other instanceof UserId)) return false;
    return this._value === other._value;
  }

  public getValue(): string {
    return this._value;
  }
}
