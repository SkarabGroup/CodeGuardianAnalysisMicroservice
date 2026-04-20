import { Inject, Injectable } from '@nestjs/common';
import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { IAnalysisOrchestrator } from './interfaces/analysis-orchestrator.as.interface';
import { AgentRequest } from '../DTOs/models/requests/agent-request-model.model';

import type { IDocumentationAgentPort } from '../ports/externals/docs-agent-port.port';
import type { ICodeAgentPort } from '../ports/externals/code-agent-port.port';
import type { ISecurityAgentPort } from '../ports/externals/security-agent-port.port';

import { CODE_AGENT } from '../../infrastructure/adapters/externals/local-code-agent.adapter';
import { DOCS_AGENT } from '../../infrastructure/adapters/externals/docs-agent.adapter';
import { SECURITY_AGENT } from '../../infrastructure/adapters/externals/security-agent.adapter';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { IDocsReportEntityProvider } from '../../domain/services/interfaces/docs-report-entity-provider.interface';
import { DOCS_REPORT_PROVIDER } from '../../domain/services/report-entities-provider.ds';

import { v7 as uuidv7 } from 'uuid';
import { ReportId } from '../../domain/value-objects/report-id.vo';

import type { IDocsReportSavePort } from '../ports/repositories/docs-report-save-port.port';
import { DOCS_REPORT_SAVE_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { SaveDocsReportRequest } from '../DTOs/models/requests/save-docs-report-request-model.model';

import type { ICodeReportSavePort } from '../ports/repositories/code-report-save-port.repository';
import { CODE_REPORT_SAVE_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { SaveCodeReportRequest } from '../DTOs/models/requests/save-code-report-request-model.model';

import type { ISecurityReportSavePort } from '../ports/repositories/security-report-save-port.repository';
import { SECURITY_REPORT_SAVE_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { SaveSecurityReportRequest } from '../DTOs/models/requests/save-security-report-request-model.model';

import type { ICodeReportEntityProvider } from '../../domain/services/interfaces/code-report-entity-provider.interface';
import { CODE_REPORT_PROVIDER } from '../../domain/services/report-entities-provider.ds';

import type { ISecurityReportEntityProvider } from '../../domain/services/interfaces/security-report-entity-provider.interface';
import { SECURITY_REPORT_PROVIDER } from '../../domain/services/report-entities-provider.ds';

import type { IUpdateAnalysisPort } from '../ports/repositories/update-analysis-port.port';
import { ADD_REPORTS_TO_ANALYSIS_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import { AddReportsToAnalysisRequest } from '../DTOs/models/requests/add-reports-request-model.model';

@Injectable()
export class AnalysisOrchestratorService implements IAnalysisOrchestrator {
  constructor(
    @Inject(DOCS_AGENT)
    private readonly documentationAgent: IDocumentationAgentPort,
    @Inject(CODE_AGENT)
    private readonly codeAgent: ICodeAgentPort,
    @Inject(SECURITY_AGENT)
    private readonly securityAgent: ISecurityAgentPort,
    @Inject(DOCS_REPORT_PROVIDER)
    private readonly docsReportProvider: IDocsReportEntityProvider,
    @Inject(CODE_REPORT_PROVIDER)
    private readonly codeReportProvider: ICodeReportEntityProvider,
    @Inject(SECURITY_REPORT_PROVIDER)
    private readonly securityReportProvider: ISecurityReportEntityProvider,
    @Inject(DOCS_REPORT_SAVE_PORT)
    private readonly docsReportSavePort: IDocsReportSavePort,
    @Inject(CODE_REPORT_SAVE_PORT)
    private readonly codeReportSavePort: ICodeReportSavePort,
    @Inject(SECURITY_REPORT_SAVE_PORT)
    private readonly securityReportSavePort: ISecurityReportSavePort,
    @Inject(ADD_REPORTS_TO_ANALYSIS_PORT)
    private readonly updateAnalysisPort: IUpdateAnalysisPort,
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

    const docsReportId = ReportId.create(uuidv7());
    const codeReportId = ReportId.create(uuidv7());
    const securityReportId = ReportId.create(uuidv7());

    if (docs) {
      console.log('Starting documentation analysis...');
      tasks.push(
        (async () => {
          const response = await this.documentationAgent.runAnalysis(
            new AgentRequest(analysis.getAnalysisId()),
          );
          const reportFilename = `docs_analysis_report_${String(analysis.getAnalysisId().value)}.json`;
          const reportPath = path.join(process.cwd(), reportFilename);
          await fs.writeFile(reportPath, JSON.stringify(response, null, 2), 'utf-8');
          if (!response || response.analysis_report.metadata.status !== 'success') {
            console.error(
              `Documentation Agent Analysis failed or returned an unsuccessful status. Check the report at ${reportPath} for details.`,
            );
            docs = false;
            return;
          }
          const entity = this.docsReportProvider.fromDocsAgentResponse(
            response,
            docsReportId,
            analysis.getAnalysisId(),
          );
          await this.docsReportSavePort.saveDocsReport(
            new SaveDocsReportRequest(
              entity.getReportId(),
              entity.getAnalysisId(),
              entity.getApiViolations(),
              entity.getDocsDiscrepancies(),
              entity.getMissingFiles(),
              entity.getDependencyAudit(),
            ),
          );

          console.log(
            `Documentation Agent Analysis Completed Successfully!\nReport saved to: ${reportPath}`,
          );
        })(),
      );
    }

    if (code) {
      console.log('Starting code analysis...');
      tasks.push(
        (async () => {
          const response = await this.codeAgent.runAnalysis(
            new AgentRequest(analysis.getAnalysisId()),
          );
          const reportFilename = `code_analysis_report_${String(analysis.getAnalysisId().value)}.json`;
          const reportPath = path.join(process.cwd(), reportFilename);
          await fs.writeFile(reportPath, JSON.stringify(response, null, 2), 'utf-8');
          if (!response || response.analysis_report.metadata.status !== 'success') {
            console.error(
              `Code Agent Analysis failed or returned an unsuccessful status. Check the report at ${reportPath} for details.`,
            );
            code = false;
            return;
          }
          const entity = this.codeReportProvider.fromCodeAgentResponse(
            response,
            codeReportId,
            analysis.getAnalysisId(),
          );
          await this.codeReportSavePort.saveCodeReport(
            new SaveCodeReportRequest(
              entity.id,
              entity.analysisId,
              entity.metadata,
              entity.interpretation,
            ),
          );

          console.log(
            `Code Agent Analysis Completed Successfully!\nReport saved to: ${reportPath}`,
          );
        })(),
      );
    }

    if (security) {
      console.log('Starting security analysis...');
      tasks.push(
        (async () => {
          const response = await this.securityAgent.runAnalysis(
            new AgentRequest(analysis.getAnalysisId()),
          );
          const reportFilename = `security_analysis_report_${String(analysis.getAnalysisId().value)}.json`;
          const reportPath = path.join(process.cwd(), reportFilename);
          if (!response || response.analysis_report.metadata.status !== 'success') {
            console.error(
              `Security Agent Analysis failed or returned an unsuccessful status. Check the report at ${reportPath} for details.`,
            );
            security = false;
            return;
          }

          const entity = this.securityReportProvider.fromSecurityAgentResponse(
            response,
            securityReportId,
            analysis.getAnalysisId(),
          );

          await this.securityReportSavePort.saveSecurityReport(
            new SaveSecurityReportRequest(
              entity.getReportId(),
              entity.getAnalysisId(),
              entity.getDependencyFindings(),
              entity.getOwaspFindings(),
              entity.getSecretFindings(),
              entity.getToolErrors(),
            ),
          );

          console.log(
            `Security Agent Analysis Completed Successfully!\nReport saved to: ${reportPath}`,
          );
        })(),
      );
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
      const result = await this.updateAnalysisPort.addReportsToAnalysis(
        new AddReportsToAnalysisRequest(
          analysis.getAnalysisId().value,
          code ? String(codeReportId.value) : null,
          docs ? String(docsReportId.value) : null,
          security ? String(securityReportId.value) : null,
        ),
      );
      if (result.success) {
        console.log('Analysis reports added to the analysis record successfully.');
      } else {
        console.error(`Failed to add reports to analysis: ${result.message}`);
      }
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
