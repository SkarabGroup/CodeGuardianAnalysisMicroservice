import { Inject, Injectable } from '@nestjs/common';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { IAnalysisOrchestrator } from './interfaces/analysis-orchestrator.as.interface';
import type { ICodeAgentPort } from '../ports/externals/code-agent-port.port';
import { CODE_AGENT } from '../../infrastructure/adapters/externals/local-code-agent.adapter';
import { CodeAgentRequest } from '../DTOs/models/requests/code-agent-request-model.model';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class AnalysisOrchestratorService implements IAnalysisOrchestrator {
  constructor(
    @Inject(CODE_AGENT)
    private readonly codeAgent: ICodeAgentPort,
  ) {}

  private async orchestrateAnalysis(
    analysis: GitHubAnalysis,
    repoPath: string,
    code: boolean,
    docs: boolean,
    security: boolean,
  ): Promise<void> {
    console.log(
      `Analysis started for: ${analysis.getAnalysisId().value}, ${repoPath}. \n Code: ${code} \n Documentation: ${docs} \n Security: ${security}`,
    );

    if (code) {
      const response = await this.codeAgent.runAnalysis(
        new CodeAgentRequest(analysis.getAnalysisId()),
      );

      // Costruisci il percorso del file nella root del progetto (o dove preferisci)
      const reportFilename = `analysis_report_${String(analysis.getAnalysisId().value)}.json`;
      const reportPath = path.join(process.cwd(), reportFilename);

      // Scrivi la risposta su file anziché stamparla a schermo
      await fs.writeFile(reportPath, JSON.stringify(response, null, 2), 'utf-8');

      console.log(`Code Agent Analysis Completed Successfully!\nReport saved to: ${reportPath}`);
    } else {
      console.log('Neither one of the topic of the analysis was selected');
    }
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
