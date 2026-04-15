import { DescriptionFinding } from './description-finding.vo';
import { StaticAnalysisEvaluation } from './static-analysis-evaluation.vo';
import { CoverageEvaluation } from './coverage-evaluation.vo';
import { VerdictStatus } from '../enums/verdict-status.enum';

export class AIInterpretation {
  private constructor(
    private readonly _verdict: VerdictStatus,
    private readonly _executiveSummary: DescriptionFinding,
    private readonly _staticAnalysisEvaluation: StaticAnalysisEvaluation,
    private readonly _coverageEvaluation: CoverageEvaluation,
  ) {}

  public static create(
    verdict: VerdictStatus,
    executiveSummary: DescriptionFinding,
    staticAnalysisEvaluation: StaticAnalysisEvaluation,
    coverageEvaluation: CoverageEvaluation,
  ): AIInterpretation {
    if (!Object.values(VerdictStatus).includes(verdict)) throw new Error('Invalid verdict status');
    return new AIInterpretation(
      verdict,
      executiveSummary,
      staticAnalysisEvaluation,
      coverageEvaluation,
    );
  }

  public get verdict(): VerdictStatus {
    return this._verdict;
  }
  public get executiveSummary(): DescriptionFinding {
    return this._executiveSummary;
  }
  public get staticAnalysisEvaluation(): StaticAnalysisEvaluation {
    return this._staticAnalysisEvaluation;
  }
  public get coverageEvaluation(): CoverageEvaluation {
    return this._coverageEvaluation;
  }
}
