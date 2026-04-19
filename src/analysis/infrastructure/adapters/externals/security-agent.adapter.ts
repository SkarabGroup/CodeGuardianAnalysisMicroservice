import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import * as fs from 'node:fs';
import { ISecurityAgentPort } from '../../../application/ports/externals/security-agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  SecAgentResponse,
  SecAgentResponsePayload,
} from '../../../application/DTOs/models/responses/security-agent-response-model.model';

@Injectable()
export class LocalSecurityAnalysisAdapter implements ISecurityAgentPort {
  private readonly logger = new Logger(LocalSecurityAnalysisAdapter.name);

  public async runAnalysis(model: AgentRequest): Promise<SecAgentResponse> {
    const sharedVolumeName = 'analysis_tmp_data';
    const containerDir = `/tmp/${String(model.id.value)}`;
    const projectRoot = process.cwd();
    const envFilePath = join(projectRoot, 'src', 'agents', 'security', '.env');

    this.logger.log(`[Adapter] Starting security analysis for: ${containerDir}`);

    const dockerArgs = ['run', '--rm'];

    if (fs.existsSync(envFilePath)) {
      dockerArgs.push('--env-file', envFilePath);
    } else {
      this.logger.warn(
        `[Adapter] .env file not found at ${envFilePath}. Agent may lack configuration.`,
      );
    }

    dockerArgs.push('-v', `${sharedVolumeName}:/tmp`, 'strands-security-analyzer', containerDir);

    try {
      const rawOutput = await this.runContainer(dockerArgs);
      const parsed = this.extractJson(rawOutput);

      if (!parsed['analysis_report']) {
        console.debug('Raw container output:', rawOutput);
        throw new Error(rawOutput || 'Container did not return a valid analysis report.');
      }

      const report = parsed['analysis_report'] as Record<string, unknown>;
      report['metadata'] = {
        ...(report['metadata'] as Record<string, unknown>),
        repository: model.id.value,
        status: 'success',
      };

      return new SecAgentResponse(parsed as unknown as SecAgentResponsePayload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[Adapter] Container execution failed: ${errorMessage}`);
      return this.createFallbackResponse(errorMessage, model.id.value);
    }
  }

  private createFallbackResponse(reason: string, repositoryId: string): SecAgentResponse {
    return new SecAgentResponse({
      analysis_report: {
        metadata: {
          repository: repositoryId,
          status: 'FAILED',
        },
        trivy: [],
        semgrep: [],
        grype: [],
        errors: [{ tool: 'agent', description: reason }],
      },
    });
  }

  private runContainer(dockerArgs: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', dockerArgs);
      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      docker.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      docker.on('error', (err: Error) => reject(err));

      docker.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(stdout);
        } else if (stdout.trim()) resolve(stdout);
        else reject(new Error(`Container exited with code ${String(code)}.\nStderr: ${stderr}`));
      });
    });
  }

  private extractJson(raw: string): Record<string, unknown> {
    const errorToken = '{"status": "error"';
    const errorIndex = raw.lastIndexOf(errorToken);

    if (errorIndex !== -1) {
      const closingBrace = raw.indexOf('}', errorIndex);
      if (closingBrace !== -1) {
        try {
          const errString = raw.substring(errorIndex, closingBrace + 1);
          return JSON.parse(errString) as Record<string, unknown>;
        } catch (e) {
          console.debug('Failed JSON Extraction', String(e));
        }
      }
    }

    let startIndex = raw.indexOf('{');
    if (startIndex === -1) throw new Error('No JSON found in the container output.');

    let bestCandidate: Record<string, unknown> | null = null;

    while (startIndex !== -1) {
      let depth = 0;
      for (let i = startIndex; i < raw.length; i++) {
        if (raw[i] === '{') depth++;
        else if (raw[i] === '}') depth--;

        if (depth === 0) {
          const candidate = raw.substring(startIndex, i + 1);
          try {
            const parsed = JSON.parse(candidate) as Record<string, unknown>;

            if (parsed['analysis_report']) {
              return parsed;
            }

            bestCandidate = parsed;
          } catch {
            // Iterative scanning: ignore malformed JSON chunks and continue searching
          }
          break;
        }
      }
      startIndex = raw.indexOf('{', startIndex + 1);
    }

    if (bestCandidate) return bestCandidate;

    throw new Error('Unterminated JSON in container output.');
  }
}

export const SECURITY_AGENT = Symbol('SecurityAgentPort');
