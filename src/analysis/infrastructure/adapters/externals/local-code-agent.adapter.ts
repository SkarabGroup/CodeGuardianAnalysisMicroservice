import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import * as fs from 'node:fs';
import { ICodeAgentPort } from '../../../application/ports/externals/code-agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  CodeAgentResponse,
  CodeAgentResponsePayload,
} from '../../../application/DTOs/models/responses/code-agent-response-model.model';

@Injectable()
export class LocalCodeAnalysisAdapter implements ICodeAgentPort {
  private readonly logger = new Logger(LocalCodeAnalysisAdapter.name);

  constructor() {}

  public async runAnalysis(model: AgentRequest): Promise<CodeAgentResponse> {
    const sharedVolumeName = 'analysis_tmp_data';
    const containerDir = `/tmp/${String(model.id.value)}`;
    const projectRoot = process.cwd();
    const envFilePath = join(projectRoot, 'src', 'agents', 'code', '.env');

    this.logger.log(`[Adapter] Executing LOCAL Agent with Docker CLI for: ${containerDir}`);

    const dockerArgs = ['run', '--rm'];

    if (fs.existsSync(envFilePath)) {
      dockerArgs.push('--env-file', envFilePath);
    } else {
      this.logger.warn(
        `[Adapter] File ${envFilePath} not found. Agent might not have requested credentials.`,
      );
    }

    dockerArgs.push('-v', `${sharedVolumeName}:/tmp`, 'strands-code-analyzer', containerDir);

    try {
      const rawOutput = await this.runContainer(dockerArgs);
      const parsed = this.extractJson(rawOutput);
      if (!parsed['analysis_report']) {
        console.debug('Raw container output:', rawOutput);
        throw new Error(rawOutput || 'Container did not return a valid analysis report.');
      }

      console.log('[Adapter] Analysis result successfully extracted.');

      const report = parsed['analysis_report'] as Record<string, unknown>;
      report['metadata'] = {
        ...(report['metadata'] as Record<string, unknown>),
        repository: model.id.value,
        status: 'success',
      };

      return new CodeAgentResponse(parsed as unknown as CodeAgentResponsePayload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`[Adapter] Critical error during execution: ${errorMessage}`);
      return this.createFallbackResponse(errorMessage);
    }
  }

  private createFallbackResponse(reason: string): CodeAgentResponse {
    console.log("I have failed and I'm now in createFallbackResponse");
    return new CodeAgentResponse({
      analysis_report: {
        metadata: {
          status: 'error',
        },
        ai_interpretation: {
          verdict: 'Critical',
          executive_summary: `The automated analysis failed due to an infrastructure error or resource limit. Details: ${reason}`,
          static_analysis_evaluation: { total_issues_analyzed: 0, key_issues_reasoning: [] },
          coverage_evaluation: { overall_health: 'Unknown', critical_files_reasoning: [] },
        },
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
        if (code === 0) resolve(stdout);
        else if (stdout.trim()) resolve(stdout);
        else reject(new Error(`Docker exit code ${String(code)}.\nStderr: ${stderr}`));
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

export const CODE_AGENT = Symbol('CodeAgentPort');
