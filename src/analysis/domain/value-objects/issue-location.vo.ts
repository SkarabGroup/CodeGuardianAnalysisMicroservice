export class IssueLocation {
  private constructor(
    private readonly _lineStart: number,
    private readonly _lineEnd: number,
    private readonly _column: number,
  ) {}

  public static create(lineStart: number, lineEnd: number, column: number): IssueLocation {
    if (lineStart <= 0 || lineEnd < lineStart || column <= 0) {
      throw new Error('Invalid location coordinates');
    }
    return new IssueLocation(lineStart, lineEnd, column);
  }

  public get lineStart(): number {
    return this._lineStart;
  }
  public get lineEnd(): number {
    return this._lineEnd;
  }
  public get column(): number {
    return this._column;
  }
}
