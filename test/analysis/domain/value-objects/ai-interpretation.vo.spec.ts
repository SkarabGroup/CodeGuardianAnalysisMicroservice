import { AIInterpretation } from '../../../../src/analysis/domain/value-objects/ai-interpretation.vo';
import { StaticAnalysisEvaluation } from '../../../../src/analysis/domain/value-objects/static-analysis-evaluation.vo';
import { CoverageEvaluation } from '../../../../src/analysis/domain/value-objects/coverage-evaluation.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { VerdictStatus } from '../../../../src/analysis/domain/enums/verdict-status.enum';

describe('AIInterpretation', () => {
  const summary = DescriptionFinding.create('Executive summary of the analysis');
  const sa = StaticAnalysisEvaluation.create(0, []);
  const ce = CoverageEvaluation.create('Excellent', []);

  it('should create valid instance with an allowed verdict', () => {
    const vo = AIInterpretation.create(VerdictStatus.GOOD, summary, sa, ce);
    expect(vo.verdict).toBe(VerdictStatus.GOOD);
    expect(vo.executiveSummary.value).toContain('Executive summary');
    expect(vo.staticAnalysisEvaluation).toBeInstanceOf(StaticAnalysisEvaluation);
    expect(vo.coverageEvaluation).toBeInstanceOf(CoverageEvaluation);
  });

  it('should throw on an invalid verdict status', () => {
    // @ts-expect-error: force invalid status for testing
    expect(() => AIInterpretation.create('UnknownStatus', summary, sa, ce)).toThrow(
      'Invalid verdict status',
    );
  });
});
