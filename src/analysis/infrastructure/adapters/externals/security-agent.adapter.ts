import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import * as fs from 'node:fs';
import { IAgentPort } from '../../../application/ports/externals/agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  SecAgentResponse,
  SecAgentResponsePayload,
} from '../../../application/DTOs/models/responses/security-agent-response-model.model';

interface AgentRawOutput {
  trivy: unknown[];
  semgrep: unknown[];
  grype: unknown[];
  errors: { tool: string; message: string }[];
}

@Injectable()
export class LocalSecurityAnalysisAdapter implements IAgentPort {
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
      this.logger.warn(`[Adapter] .env file not found at ${envFilePath}. Agent may lack configuration.`);
    }

    dockerArgs.push(
      '-v', `${sharedVolumeName}:/tmp`,
      'strands-security-analyzer',
      containerDir,
    );

    try {
      const rawOutput = await this.runContainer(dockerArgs);
      const parsed = this.extractAgentOutput(rawOutput);

      this.logger.log(
        `[Adapter] Analysis complete. ` +
        `trivy=${parsed.trivy.length}, semgrep=${parsed.semgrep.length}, ` +
        `grype=${parsed.grype.length}, errors=${parsed.errors.length}`,
      );

      const payload: SecurityAgentResponsePayload = {
        repositoryId: model.id.value,
        trivy: parsed.trivy,
        semgrep: parsed.semgrep,
        grype: parsed.grype,
        errors: parsed.errors,
      };

      return new SecurityAgentResponse(payload);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[Adapter] Container execution failed: ${errorMessage}`);
      return this.createFallbackResponse(errorMessage, model.id.value);
    }
  }

  private createFallbackResponse(reason: string, repositoryId: string): SecurityAgentResponse {
    const payload: SecurityAgentResponsePayload = {
      repositoryId,
      trivy: [],
      semgrep: [],
      grype: [],
      errors: [{ tool: 'agent', message: reason }],
    };
    return new SecurityAgentResponse(payload);
  }

  private runContainer(dockerArgs: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', dockerArgs);
      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      docker.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

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
        }
        break;
      }
    }

    throw new Error('Could not extract a valid agent report from container output.');
  }
  
  private isValidAgentOutput(obj: unknown): obj is AgentRawOutput {
    if (typeof obj !== 'object' || obj === null) return false;
    const o = obj as Record<string, unknown>;
    return Array.isArray(o['trivy']) && Array.isArray(o['semgrep']) && Array.isArray(o['grype']);
  }
}

export const SECURITY_AGENT = Symbol('SecurityAgentPort');