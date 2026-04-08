import { CoveragePercentage } from './coverage-percentage.vo';
import { FileCoverage } from './file-coverage.vo';
import { SupportedLanguages } from '../enums/supported-languages.enum';

export class CoverageFinding {
  private constructor(
    private readonly _totalLinesPercentage: CoveragePercentage,
    private readonly _totalBranchesPercentage: CoveragePercentage,
    private readonly _coverageFiles: FileCoverage[],
    private readonly _analyzedLanguage: SupportedLanguages,
  ) {
    this.validate();
  }

  private validate(): void {
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

    if (!Object.values(SupportedLanguages).includes(this._analyzedLanguage)) {
      throw new Error('Invalid analyzed language');
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

  public getAnalyzedLanguage(): SupportedLanguages {
    return this._analyzedLanguage;
  }

  public static create(
    totalLinesPercentage: CoveragePercentage,
    totalBranchesPercentage: CoveragePercentage,
    coverageFiles: FileCoverage[],
    language: string,
  ): CoverageFinding {
    const normalizedLanguage = language.trim().toUpperCase();

    if (!(totalLinesPercentage instanceof CoveragePercentage)) {
      throw new Error('Invalid totalLinesPercentage');
    }

    if (!(totalBranchesPercentage instanceof CoveragePercentage)) {
      throw new Error('Invalid totalBranchesPercentage');
    }

    if (!Array.isArray(coverageFiles)) {
      throw new Error('Coverage files must be an array');
    }

    coverageFiles.forEach((fc) => {
      if (!(fc instanceof FileCoverage)) {
        throw new Error('Invalid FileCoverage');
      }
    });

    return new CoverageFinding(
      totalLinesPercentage,
      totalBranchesPercentage,
      coverageFiles,
      normalizedLanguage as SupportedLanguages,
    );
  }
}
