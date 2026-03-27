export class BranchName {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: string): void {
    // ^(?!\/)           -> Non può iniziare con /
    // (?!.*\/$)         -> Non può finire con /
    // (?!.*[\.\.]{2})   -> Non può contenere .. (sequenza di due punti)
    // [^\~\^\:\?\*\[]+  -> Non può contenere caratteri speciali proibiti (~ ^ : ? * [)
    // $                 -> Fine stringa
    const gitBranchRegex = /^(?!\/)(?!.*\/$)(?!.*\.\.)[^ ~^:?*[]+$/;

    if (!gitBranchRegex.test(value)) {
      throw new Error('Invalid branch name format');
    }
  }

  public equals(other: BranchName): boolean {
    return other instanceof BranchName && other._value === this._value;
  }

  public getValue(): string {
    return this._value;
  }

  public static create(value: string): BranchName {
    if (!value || !value.trim()) {
      throw new Error('Must be passed a string');
    }
    return new BranchName(value.trim());
  }
}
