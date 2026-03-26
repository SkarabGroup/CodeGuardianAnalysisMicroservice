import { validate as uuidValidate } from 'uuid';

export class AnalisysId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  public static create(value: string): AnalisysId {
    if (typeof value !== 'string') {
      throw new Error('AnalisysId must be a string');
    }
    return new AnalisysId(value);
  }

  private validate(value: string): void {
    if (!uuidValidate(value)) {
      throw new Error('Invalid UUID format for AnalisysId : ' + value);
    }
  }

  public equals(other: AnalisysId): boolean {
    if (!(other instanceof AnalisysId) || other === null) return false;
    return this._value === other._value;
  }
}
