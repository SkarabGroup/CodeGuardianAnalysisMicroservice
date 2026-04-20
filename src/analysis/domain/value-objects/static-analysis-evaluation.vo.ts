import { KeyIssueReasoning } from './key-issue-reasoning.vo';
export class StaticAnalysisEvaluation {
  private constructor(
    private readonly _totalIssuesAnalyzed: number,
    private readonly _keyIssuesReasoning: KeyIssueReasoning[],
  ) {}

  public static create(
    totalIssuesAnalyzed: number,
    keyIssuesReasoning: KeyIssueReasoning[],
  ): StaticAnalysisEvaluation {
    if (totalIssuesAnalyzed < 0) throw new Error('Total issues cannot be negative');
    return new StaticAnalysisEvaluation(totalIssuesAnalyzed, [...keyIssuesReasoning]);
  }

  public get totalIssuesAnalyzed(): number {
    return this._totalIssuesAnalyzed;
  }
  public get keyIssuesReasoning(): KeyIssueReasoning[] {
    return [...this._keyIssuesReasoning];
  }
}
