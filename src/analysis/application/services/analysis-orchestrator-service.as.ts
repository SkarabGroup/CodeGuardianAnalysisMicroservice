import { Injectable } from '@nestjs/common';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { IAnalysisOrchestrator } from './interfaces/analysis-orchestrator.as.interface';

@Injectable()
export class AnalysisOrchestratorService implements IAnalysisOrchestrator {
  constructor() {}

  private async orchestrateAnalysis(
    analysis: GitHubAnalysis,
    repoPath: string,
    code: boolean,
    docs: boolean,
    security: boolean,
  ): Promise<void> {
    await Promise.resolve();
    console.log(
      `Analysis started for: ${analysis.getAnalysisId().value}, ${repoPath}. \n Code: ${code} \n Documentation: ${docs} \n Security: ${security}`,
    );
  }

  public analyze(
    analysis: GitHubAnalysis,
    path: string,
    code: boolean,
    docs: boolean,
    security: boolean,
  ): void {
    this.orchestrateAnalysis(analysis, path, code, docs, security).catch((err) => {
      console.error('AI Orchestration failed:', err);
    });
  }
}

export const ANALYSIS_ORCHESTRATOR = Symbol('IAnalysisOrchestrator');
