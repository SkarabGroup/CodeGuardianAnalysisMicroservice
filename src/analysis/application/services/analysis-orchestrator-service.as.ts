import { Inject, Injectable } from '@nestjs/common';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { IAnalysisOrchestrator } from './interfaces/analysis-orchestrator.as.interface';
//import type { IAgentPort } from '../ports/externals/agent-port.port';
//import { CODE_AGENT } from '../../infrastructure/adapters/externals/code-agent.adapter';
import { AgentRequest } from '../DTOs/models/requests/agent-request-model.model';
import { DOCS_AGENT } from '../../infrastructure/adapters/externals/docs-agent.adapter';
import type { IDocumentationAgentPort } from '../ports/externals/docs-agent-port.port';

@Injectable()
export class AnalysisOrchestratorService implements IAnalysisOrchestrator {
  constructor(
    //@Inject(CODE_AGENT)
    //private readonly codeAgent: IAgentPort,
    @Inject(DOCS_AGENT)
    private readonly documentationAgent: IDocumentationAgentPort,
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
    //await this.codeAgent.runAnalysis(new AgentRequest(analysis.getAnalysisId()));
    await this.documentationAgent.runAnalysis(new AgentRequest(analysis.getAnalysisId()));
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
