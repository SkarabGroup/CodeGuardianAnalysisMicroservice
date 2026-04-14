import { CriticalFileReasoning } from './critical-file-reasoning.vo';
export class CoverageEvaluation {
  private constructor(
    private readonly _overallHealth: string,
    private readonly _criticalFilesReasoning: CriticalFileReasoning[],
  ) {}

  public static create(
    overallHealth: string,
    criticalFilesReasoning: CriticalFileReasoning[],
  ): CoverageEvaluation {
    if (!overallHealth.trim()) throw new Error('Overall health string cannot be empty');
    return new CoverageEvaluation(overallHealth.trim(), [...criticalFilesReasoning]);
  }

  public get overallHealth(): string {
    return this._overallHealth;
  }
  public get criticalFilesReasoning(): CriticalFileReasoning[] {
    return [...this._criticalFilesReasoning];
  }
}
