export class RepoURL {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: string): void {
    if (!value.startsWith('https://')) {
      throw new Error('The provided string origin is not a valid URL');
    }
    const repoURL = new URL(value);

    if (repoURL.hostname !== 'github.com') {
      throw new Error("URL must be of 'github.com'");
    }

    const pathParts = repoURL.pathname.split('/').filter((part) => part.length > 0);
    if (pathParts.length < 2) {
      throw new Error('The number of parameters in the pathname is insufficient');
    }
  }

  public equals(other: RepoURL): boolean {
    return other instanceof RepoURL && this._value === other._value;
  }

  public get value(): string {
    return this._value;
  }

  public static create(value: string): RepoURL {
    if (!value || !value.trim()) {
      throw new Error('Must be passed a string');
    }
    return new RepoURL(value.trim());
  }
}
