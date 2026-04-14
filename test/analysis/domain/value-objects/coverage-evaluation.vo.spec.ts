import { CoverageEvaluation } from '../../../../src/analysis/domain/value-objects/coverage-evaluation.vo';

describe('CoverageEvaluation', () => {
  it('should create a valid instance', () => {
    const vo = CoverageEvaluation.create('Poor', []);
    expect(vo.overallHealth).toBe('Poor');
    expect(vo.criticalFilesReasoning).toHaveLength(0);
  });

  it('should throw if overallHealth is empty or whitespace', () => {
    expect(() => CoverageEvaluation.create('  ', [])).toThrow(
      'Overall health string cannot be empty',
    );
  });
});
