import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { ICodeAgentPort } from '../../../application/ports/externals/code-agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  CodeAgentResponse,
  CodeAgentResponsePayload,
} from '../../../application/DTOs/models/responses/code-agent-response-model.model';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class AWSCodeAnalysisAdapter implements ICodeAgentPort {
  private readonly logger = new Logger(AWSCodeAnalysisAdapter.name);
  private readonly ecsClient: ECSClient;

  constructor(private readonly configService: ConfigurationService) {
    this.ecsClient = new ECSClient({ region: this.configService.awsRegion });
  }

  public async runAnalysis(model: AgentRequest): Promise<CodeAgentResponse> {
    const containerDir = `/tmp/${String(model.id.value)}`;
    const outputFilePath = `${containerDir}/output.json`;

    this.logger.log(`[Adapter] Lancio Task ECS Fargate per: ${containerDir}`);

    const subnets = process.env.ECS_SUBNETS ? process.env.ECS_SUBNETS.split(',') : [];
    const securityGroups = process.env.ECS_SECURITY_GROUPS
      ? process.env.ECS_SECURITY_GROUPS.split(',')
      : [];

    const runTaskCommand = new RunTaskCommand({
      cluster: process.env.ECS_CLUSTER_NAME || 'code-guardian-cluster',
      taskDefinition: process.env.ECS_AGENT_TASK_DEF || 'strands-code-analyzer-task',
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: subnets,
          securityGroups: securityGroups,
          assignPublicIp: 'ENABLED',
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: 'strands-code-analyzer',
            command: [containerDir, '--output-file', outputFilePath],
          },
        ],
      },
    });

    try {
      await this.ecsClient.send(runTaskCommand);

      this.logger.log(`[Adapter] Waiting EFS Analysis Completion`);
      const rawOutput = await this.waitForOutputFile(outputFilePath, 900, 5);

      await fs.rm(outputFilePath, { force: true }).catch(() => {});

      const parsed = this.extractJson(rawOutput);
      return this.parseAndValidateResponse(parsed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[Adapter] Critical error during Fargate execution: ${errorMessage}`);
      return this.createFallbackResponse(errorMessage);
    }
  }

  private async waitForOutputFile(
    filePath: string,
    timeoutSeconds: number,
    pollIntervalSeconds: number,
  ): Promise<string> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    const pollIntervalMs = pollIntervalSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        if (content && content.trim().length > 0) return content;
      } catch (err) {
        if (err instanceof Error && 'code' in err) {
          const code = (err as unknown as { code: string }).code;
          if (code !== 'ENOENT') {
            this.logger.warn(`[Adapter] Errore inaspettato in lettura ${filePath}: ${err.message}`);
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new Error('Timeout: The analysis task took too long to write the output file.');
  }

  private parseAndValidateResponse(parsed: Record<string, unknown>): CodeAgentResponse {
    if (parsed['status'] === 'error' || parsed['error']) {
      const rawError = parsed['message'] ?? parsed['error'] ?? 'Unknown error from Python tool';
      throw new Error(typeof rawError === 'string' ? rawError : JSON.stringify(rawError));
    }
    return new CodeAgentResponse(parsed as unknown as CodeAgentResponsePayload);
  }

  private extractJson(raw: string): Record<string, unknown> {
    const start = raw.indexOf('{');
    if (start === -1) throw new Error('No JSON found in the container output.');
    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') depth--;
      if (depth === 0) {
        try {
          return JSON.parse(raw.substring(start, i + 1)) as Record<string, unknown>;
        } catch {
          /* Ignore and continue */
        }
      }
    }
    throw new Error('Unterminated JSON in container output.');
  }

  private createFallbackResponse(reason: string): CodeAgentResponse {
    return new CodeAgentResponse({
      metadata: {
        status: 'error',
      },
      ai_interpretation: {
        verdict: 'Critical',
        executive_summary: `The automated analysis failed due to an infrastructure error or resource limit. Details: ${reason}`,
        static_analysis_evaluation: { total_issues_analyzed: 0, key_issues_reasoning: [] },
        coverage_evaluation: { overall_health: 'Unknown', critical_files_reasoning: [] },
      },
    });
  }
}
