export class PositionFinding {
  private constructor(
    private readonly _lineStart: number,
    private readonly _lineEnd: number,
    private readonly _column: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Number.isInteger(this._lineStart) || this._lineStart <= 0)
      throw new Error('lineStart must be a positive integer');
    if (!Number.isInteger(this._lineEnd) || this._lineEnd <= 0)
      throw new Error('lineEnd must be a positive integer');
    if (this._lineStart > this._lineEnd)
      throw new Error('lineStart must be less than or equal to lineEnd');
    if (!Number.isInteger(this._column) || this._column < 0)
      throw new Error('column must be a non-negative integer');
  }

  public static create(lineStart: number, lineEnd: number, column: number): PositionFinding {
    if (typeof lineStart !== 'number') throw new Error('lineStart must be a number');
    if (typeof lineEnd !== 'number') throw new Error('lineEnd must be a number');
    if (typeof column !== 'number') throw new Error('column must be a number');
    return new PositionFinding(lineStart, lineEnd, column);
  }

  public getLineStart(): number { return this._lineStart; }
  public getLineEnd(): number { return this._lineEnd; }
  public getColumn(): number { return this._column; }

  public equals(other: PositionFinding): boolean {
    if (!(other instanceof PositionFinding)) throw new Error('Invalid argument');
    return (
      this._lineStart === other._lineStart &&
      this._lineEnd === other._lineEnd &&
      this._column === other._column
    );
  }
}