import { GitHubAnalysis } from '../../../domain/entities/github-analysis.entity';

export interface IAnalysisOrchestrator {
  analyze(
    analysis: GitHubAnalysis,
    path: string,
    code: boolean,
    docs: boolean,
    security: boolean,
  ): void;
}
