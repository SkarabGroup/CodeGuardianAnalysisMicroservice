import { StaticAnalysisEvaluation } from '../../../../src/analysis/domain/value-objects/static-analysis-evaluation.vo';

describe('StaticAnalysisEvaluation', () => {
  it('should create a valid instance with empty reasoning list', () => {
    const vo = StaticAnalysisEvaluation.create(265, []);
    expect(vo.totalIssuesAnalyzed).toBe(265);
    expect(vo.keyIssuesReasoning).toHaveLength(0);
  });

  it('should throw if total issues is negative', () => {
    expect(() => StaticAnalysisEvaluation.create(-10, [])).toThrow(
      'Total issues cannot be negative',
    );
  });
});
