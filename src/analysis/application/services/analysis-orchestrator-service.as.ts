import { Inject, Injectable } from '@nestjs/common';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { IAnalysisOrchestrator } from './interfaces/analysis-orchestrator.as.interface';
import { AgentRequest } from '../DTOs/models/requests/agent-request-model.model';

import type { IDocumentationAgentPort } from '../ports/externals/docs-agent-port.port';
import type { ICodeAgentPort } from '../ports/externals/code-agent-port.port';

import { CODE_AGENT } from '../../infrastructure/adapters/externals/local-code-agent.adapter';
import { DOCS_AGENT } from '../../infrastructure/adapters/externals/docs-agent.adapter';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class AnalysisOrchestratorService implements IAnalysisOrchestrator {
  constructor(
    @Inject(DOCS_AGENT)
    private readonly documentationAgent: IDocumentationAgentPort,
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

    const tasks: Promise<void>[] = [];

    if (docs) {
      tasks.push(
        (async () => {
          const response = await this.documentationAgent.runAnalysis(
            new AgentRequest(analysis.getAnalysisId()),
          );
          const reportFilename = `docs_analysis_report_${String(analysis.getAnalysisId().value)}.json`;
          const reportPath = path.join(process.cwd(), reportFilename);
          await fs.writeFile(reportPath, JSON.stringify(response, null, 2), 'utf-8');
          console.log(
            `Documentation Agent Analysis Completed Successfully!\nReport saved to: ${reportPath}`,
          );
        })(),
      );
    }

    if (code) {
      tasks.push(
        (async () => {
          const response = await this.codeAgent.runAnalysis(
            new AgentRequest(analysis.getAnalysisId()),
          );
          const reportFilename = `code_analysis_report_${String(analysis.getAnalysisId().value)}.json`;
          const reportPath = path.join(process.cwd(), reportFilename);
          await fs.writeFile(reportPath, JSON.stringify(response, null, 2), 'utf-8');
          console.log(
            `Code Agent Analysis Completed Successfully!\nReport saved to: ${reportPath}`,
          );
        })(),
      );
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
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
