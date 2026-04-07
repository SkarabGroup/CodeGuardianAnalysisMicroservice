import { CoveragePercentage } from './coverage-percentage.vo';
import { FileCoverage } from './file-coverage.vo';

export class CoverageFinding {
  private constructor(
    private readonly _totalLinesPercentage: CoveragePercentage,
    private readonly _totalBranchesPercentage: CoveragePercentage,
    private readonly _coverageFiles: FileCoverage[],
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Array.isArray(this._coverageFiles)) {
      throw new Error('Coverage files must be an array');
    }

    const paths = this._coverageFiles.map((fc) => fc.getPath().value);
    const unique = new Set(paths);
    if (unique.size !== paths.length) {
      throw new Error('Two files cannot have the same path');
    }

    if (this._coverageFiles.length === 0) {
      if (this._totalLinesPercentage.value !== 0 || this._totalBranchesPercentage.value !== 0) {
        throw new Error('Total lines and branches coverage must be 0 when no files are present');
      }
    }

    if (this._totalLinesPercentage.value === 0 && this._totalBranchesPercentage.value !== 0) {
      throw new Error('Total branch coverage must be 0 when line coverage is 0');
    }
  }

  public equals(other: CoverageFinding): boolean {
    if (!(other instanceof CoverageFinding)) {
      throw new Error('Invalid argument');
    }
    return (
      this._totalLinesPercentage.equals(other._totalLinesPercentage) &&
      this._totalBranchesPercentage.equals(other._totalBranchesPercentage) &&
      this.covFileEqual(this._coverageFiles, other._coverageFiles)
    );
  }

  private covFileEqual(a: FileCoverage[], b: FileCoverage[]): boolean {
    if (a.length !== b.length) return false;

    const sortFn = (x: FileCoverage, y: FileCoverage) =>
      x.getPath().value.localeCompare(y.getPath().value);

    const sortedA = [...a].sort(sortFn);
    const sortedB = [...b].sort(sortFn);

    return sortedA.every((val, i) => val.equals(sortedB[i]));
  }

  public getTotalLinesPercentage(): CoveragePercentage {
    return this._totalLinesPercentage;
  }

  public getTotalBranchesPercentage(): CoveragePercentage {
    return this._totalBranchesPercentage;
  }

  public getCoverageFiles(): FileCoverage[] {
    return [...this._coverageFiles];
  }

  public static create(
    totalLinesPercentage: CoveragePercentage,
    totalBranchesPercentage: CoveragePercentage,
    coverageFiles: FileCoverage[],
  ): CoverageFinding {
    return new CoverageFinding(totalLinesPercentage, totalBranchesPercentage, coverageFiles);
  }
}
