import { CoveragePercentage } from './coverage-percentage.vo';
import { PathFinding } from './path-finding.vo';

export class FileCoverage {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _linesPercentage: CoveragePercentage,
    private readonly _branchesPercentage: CoveragePercentage,
    private readonly _missedLines: number[],
  ) {
    this.validate();
  }

  private validate(): void {
    if (this._missedLines.some((line) => line <= 0)) {
      throw new Error('Line numbers must be greater than 0');
    }

    if (this._missedLines.some((line) => !Number.isInteger(line))) {
      throw new Error('Line numbers must be integers');
    }

    const unique = new Set(this._missedLines);
    if (unique.size !== this._missedLines.length) {
      throw new Error('Missed lines must not contain duplicates');
    }

    if (this._linesPercentage.value === 1 && this._missedLines.length > 0) {
      throw new Error('Missed lines must be empty when coverage is 100%');
    }
  }

  public equals(other: FileCoverage): boolean {
    if (!(other instanceof FileCoverage)) {
      throw new Error('Invalid argument');
    }
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._linesPercentage.equals(other._linesPercentage) &&
      this._branchesPercentage.equals(other._branchesPercentage) &&
      this.arraysEqual(this._missedLines, other._missedLines)
    );
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }

  public getPath(): PathFinding {
    return this._pathFinding;
  }

  public getLinesPercentage(): CoveragePercentage {
    return this._linesPercentage;
  }

  public getBranchesPercentage(): CoveragePercentage {
    return this._branchesPercentage;
  }

  public getMissedLines(): number[] {
    return [...this._missedLines];
  }

  public static create(
    pathFinding: PathFinding,
    linesPercentage: CoveragePercentage,
    branchesPercentage: CoveragePercentage,
    missedLines: number[],
  ): FileCoverage {
    return new FileCoverage(pathFinding, linesPercentage, branchesPercentage, missedLines);
  }
}
