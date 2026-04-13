import { StaticAnalysisIssue } from './static-analysis-issue.vo';

export class StaticAnalysisFinding {
  private constructor(
    private readonly _totalIssues: number,
    private readonly _staticAnalysisIssues: StaticAnalysisIssue[],
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Number.isInteger(this._totalIssues) || this._totalIssues < 0)
      throw new Error('totalIssues must be a non-negative integer');
    this._staticAnalysisIssues.forEach((issue) => {
      if (!(issue instanceof StaticAnalysisIssue)) throw new Error('Invalid StaticAnalysisIssue');
    });
  }

  public static create(
    totalIssues: number,
    issues: StaticAnalysisIssue[],
  ): StaticAnalysisFinding {
    if (typeof totalIssues !== 'number') throw new Error('totalIssues must be a number');
    if (!Array.isArray(issues)) throw new Error('issues must be an array');
    return new StaticAnalysisFinding(totalIssues, issues);
  }

  public getTotalIssues(): number { return this._totalIssues; }
  public getIssues(): StaticAnalysisIssue[] { return [...this._staticAnalysisIssues]; }

  public equals(other: StaticAnalysisFinding): boolean {
    if (!(other instanceof StaticAnalysisFinding)) throw new Error('Invalid argument');
    return (
      this._totalIssues === other._totalIssues &&
      this._staticAnalysisIssues.length === other._staticAnalysisIssues.length &&
      this._staticAnalysisIssues.every((issue, i) => issue.equals(other._staticAnalysisIssues[i]))
    );
  }
}