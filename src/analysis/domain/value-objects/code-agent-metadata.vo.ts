export class CodeAgentMetadata {
  private constructor(
    private readonly _language: string,
    private readonly _status: string,
  ) {}

  public static create(language: string, status: string): CodeAgentMetadata {
    if (!status.trim()) {
      throw new Error('Status cannot be empty');
    }
    return new CodeAgentMetadata(language.trim(), status.trim());
  }
  public get language(): string {
    return this._language;
  }
  public get status(): string {
    return this._status;
  }
}
