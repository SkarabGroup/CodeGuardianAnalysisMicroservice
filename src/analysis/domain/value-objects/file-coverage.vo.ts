import { CoveragePercentage } from './coverage-percentage.vo';
import { PathFinding } from './path-finding.vo';

export class FileCoverage {
  private constructor(
    private readonly pathFinding: PathFinding,
    private readonly linesPercentage: CoveragePercentage,
    private readonly branchesPercentage: CoveragePercentage,
    private readonly missedLines: number[],
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.missedLines.some((line) => line <= 0)) {
      throw new Error('Line numbers must be greater than 0');
    }

    if (this.missedLines.some((line) => !Number.isInteger(line))) {
      throw new Error('Line numbers must be integers');
    }

    const unique = new Set(this.missedLines);
    if (unique.size !== this.missedLines.length) {
      throw new Error('Missed lines must not contain duplicates');
    }

    if (this.linesPercentage.value === 1 && this.missedLines.length > 0) {
      throw new Error('Missed lines must be empty when coverage is 100%');
    }
  }

  public equals(other: FileCoverage): boolean {
    if (!(other instanceof FileCoverage)) {
      throw new Error('Invalid argument');
    }
    return (
      this.pathFinding.equals(other.pathFinding) &&
      this.linesPercentage.equals(other.linesPercentage) &&
      this.branchesPercentage.equals(other.branchesPercentage) &&
      this.arraysEqual(this.missedLines, other.missedLines)
    );
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }

  public getPath(): PathFinding {
    return this.pathFinding;
  }

  public getLinesPercentage(): CoveragePercentage {
    return this.linesPercentage;
  }

  public getBranchesPercentage(): CoveragePercentage {
    return this.branchesPercentage;
  }

  public getMissedLines(): number[] {
    return [...this.missedLines];
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
