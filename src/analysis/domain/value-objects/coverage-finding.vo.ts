import { FileCoverage } from './file-coverage.vo';
import { DescriptionFinding } from './description-finding.vo';

export class CoverageFinding {
  private constructor(
    private readonly _overallHealth: DescriptionFinding,
    private readonly _criticalFiles: FileCoverage[],
  ) {
    this.validate();
  }

  private validate(): void {
    const paths = this._criticalFiles.map((f) => f.getPathFinding().value);
    const unique = new Set(paths);
    if (unique.size !== paths.length)
      throw new Error('Critical files must not contain duplicate paths');
  }

  public static create(
    overallHealth: DescriptionFinding,
    criticalFiles: FileCoverage[],
  ): CoverageFinding {
    if (!(overallHealth instanceof DescriptionFinding))
      throw new Error('Invalid overallHealth');
    if (!Array.isArray(criticalFiles))
      throw new Error('criticalFiles must be an array');
    criticalFiles.forEach((f) => {
      if (!(f instanceof FileCoverage)) throw new Error('Invalid FileCoverage');
    });

    return new CoverageFinding(overallHealth, criticalFiles);
  }

  public getOverallHealth(): DescriptionFinding { return this._overallHealth; }
  public getCriticalFiles(): FileCoverage[] { return [...this._criticalFiles]; }

  public equals(other: CoverageFinding): boolean {
    if (!(other instanceof CoverageFinding)) throw new Error('Invalid argument');
    if (!this._overallHealth.equals(other._overallHealth)) return false;
    if (this._criticalFiles.length !== other._criticalFiles.length) return false;

    const sort = (files: FileCoverage[]) =>
      [...files].sort((a, b) =>
        a.getPathFinding().value.localeCompare(b.getPathFinding().value),
      );

    return sort(this._criticalFiles).every((f, i) =>
      f.equals(sort(other._criticalFiles)[i]),
    );
  }
}