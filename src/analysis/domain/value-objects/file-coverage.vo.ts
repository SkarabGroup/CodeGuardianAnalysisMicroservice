import { PathFinding } from './path-finding.vo';
import { CoveragePercentage } from './coverage-percentage.vo';
import { DescriptionFinding } from './description-finding.vo';

export class FileCoverage {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _linesPercentage: CoveragePercentage,
    private readonly _missingLines: number[],
    private readonly _missingBranches: number,
    private readonly _aiReasoning: DescriptionFinding,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Number.isInteger(this._missingBranches) || this._missingBranches < 0)
      throw new Error('missingBranches must be a non-negative integer');

    if (this._missingLines.some((l) => !Number.isInteger(l) || l <= 0))
      throw new Error('Line numbers must be positive integers');

    const unique = new Set(this._missingLines);
    if (unique.size !== this._missingLines.length)
      throw new Error('Missing lines must not contain duplicates');

    if (this._linesPercentage.value === 1 && this._missingLines.length > 0)
      throw new Error('Missing lines must be empty when line coverage is 100%');
  }

  public static create(
    pathFinding: PathFinding,
    linesPercentage: CoveragePercentage,
    missingLines: number[],
    missingBranches: number,
    aiReasoning: DescriptionFinding,
  ): FileCoverage {
    if (!(pathFinding instanceof PathFinding)) throw new Error('Invalid PathFinding');
    if (!(linesPercentage instanceof CoveragePercentage)) throw new Error('Invalid linesPercentage');
    if (!Array.isArray(missingLines)) throw new Error('missingLines must be an array');
    if (typeof missingBranches !== 'number') throw new Error('missingBranches must be a number');
    if (!(aiReasoning instanceof DescriptionFinding)) throw new Error('Invalid aiReasoning');

    return new FileCoverage(pathFinding, linesPercentage, missingLines, missingBranches, aiReasoning);
  }

  public getPathFinding(): PathFinding { return this._pathFinding; }
  public getLinesPercentage(): CoveragePercentage { return this._linesPercentage; }
  public getMissingLines(): number[] { return [...this._missingLines]; }
  public getMissingBranches(): number { return this._missingBranches; }
  public getAiReasoning(): DescriptionFinding { return this._aiReasoning; }

  public equals(other: FileCoverage): boolean {
    if (!(other instanceof FileCoverage)) throw new Error('Invalid argument');
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._linesPercentage.equals(other._linesPercentage) &&
      this._missingBranches === other._missingBranches &&
      this._missingLines.length === other._missingLines.length &&
      this._missingLines.every((l, i) => l === other._missingLines[i])
    );
  }
}