export class PersonalAccessToken {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  public static create(value: string): PersonalAccessToken {
    return new PersonalAccessToken(value);
  }

  private validate(token: string): void {
    if (!token || token.trim().length === 0) {
      throw new Error('PAT cannot be null, empty, or blank');
    }

    const pattern = /^(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})$/;

    if (!pattern.test(token)) {
      throw new Error('PAT has an invalid format');
    }
  }

  public equals(other: PersonalAccessToken): boolean {
    return other instanceof PersonalAccessToken && this._value === other._value;
  }
}
