import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import * as fs from 'node:fs';
import { ISecurityAgentPort } from '../../../application/ports/externals/security-agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  SecTrivyFindingDTO,
  SecSemgrepFindingDTO,
  SecGrypeFindingDTO,
  SecAgentResponse,
  SecAgentResponsePayload,
} from '../../../application/DTOs/models/responses/security-agent-response-model.model';

interface AgentRawOutput {
  analysis_report: {
    metadata: {
      repository: string;
      status: string;
    };
    trivy: SecTrivyFindingDTO[];
    semgrep: SecSemgrepFindingDTO[];
    grype: SecGrypeFindingDTO[];
    errors: { tool: string; description: string }[];
  };
}

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
      const parsed = this.extractAgentOutput(rawOutput);

      if (!parsed.analysis_report) {
        throw new Error('Invalid agent output: missing analysis_report');
      }
      const report = parsed.analysis_report;

      this.logger.log(
        `[Adapter] Analysis complete. ` +
          `trivy=${report.trivy.length}, semgrep=${report.semgrep.length}, ` +
          `grype=${report.grype.length}, errors=${report.errors.length}`,
      );

      const payload: SecAgentResponsePayload = {
        analysis_report: {
          metadata: report.metadata,
          trivy: report.trivy,
          semgrep: report.semgrep,
          grype: report.grype,
          errors: report.errors,
        },
      };

      return new SecAgentResponse(payload);
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
        } else {
          if (stderr) this.logger.error(`[Container stderr] ${stderr.trim()}`);
          reject(new Error(`Container exited with code ${String(code)}.`));
        }
      });
    });
  }

  private extractAgentOutput(raw: string): AgentRawOutput {
    try {
      const parsed = JSON.parse(raw.trim()) as AgentRawOutput;
      if (this.isValidAgentOutput(parsed)) return parsed;
    } catch {
      // If direct parsing fails, attempt to extract JSON from mixed output (e.g., logs + JSON).
    }

    const startIndex = raw.indexOf('{');
    if (startIndex === -1) {
      throw new Error('No JSON object found in container stdout.');
    }

    let depth = 0;
    for (let i = startIndex; i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') depth--;

      if (depth === 0) {
        const candidate = raw.substring(startIndex, i + 1);
        try {
          const parsed = JSON.parse(candidate) as AgentRawOutput;
          if (this.isValidAgentOutput(parsed)) return parsed;
        } catch {
          // Continue searching if parsing fails.
        }
        break;
      }
    }

    throw new Error('Could not extract a valid agent report from container output.');
  }

  private isValidAgentOutput(obj: unknown): obj is AgentRawOutput {
    if (typeof obj !== 'object' || obj === null) return false;

    const o = obj as Record<string, unknown>;
    const report = o['analysis_report'];

    if (typeof report !== 'object' || report === null) return false;

    const r = report as Record<string, unknown>;

    return (
      Array.isArray(r['trivy']) &&
      Array.isArray(r['semgrep']) &&
      Array.isArray(r['grype']) &&
      Array.isArray(r['errors'])
    );
  }
}

export const SECURITY_AGENT = Symbol('SecurityAgentPort');
