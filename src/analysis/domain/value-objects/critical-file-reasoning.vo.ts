import { CoveragePercentage } from './coverage-percentage.vo';
import { PathFinding } from './path-finding.vo';
import { DescriptionFinding } from './description-finding.vo';
export class CriticalFileReasoning {
  private constructor(
    private readonly _file: PathFinding,
    private readonly _lineCoveragePct: CoveragePercentage,
    private readonly _missingLines: number[],
    private readonly _missingBranches: number,
    private readonly _aiReasoning: DescriptionFinding,
  ) {}

  public static create(
    file: PathFinding,
    lineCoveragePct: CoveragePercentage,
    missingLines: number[],
    missingBranches: number,
    aiReasoning: DescriptionFinding,
  ): CriticalFileReasoning {
    if (missingBranches < 0) throw new Error('Missing branches cannot be negative');
    return new CriticalFileReasoning(
      file,
      lineCoveragePct,
      [...missingLines],
      missingBranches,
      aiReasoning,
    );
  }

  public get file(): PathFinding {
    return this._file;
  }
  public get lineCoveragePct(): CoveragePercentage {
    return this._lineCoveragePct;
  }
  public get missingLines(): number[] {
    return [...this._missingLines];
  }
  public get missingBranches(): number {
    return this._missingBranches;
  }
  public get aiReasoning(): DescriptionFinding {
    return this._aiReasoning;
  }
}
