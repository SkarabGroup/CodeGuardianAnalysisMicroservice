import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { IAgentPort } from '../../../application/ports/externals/agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import { AgentResponse } from '../../../application/DTOs/models/responses/agent-response-model.model';

@Injectable()
export class CodeAnalysisAdapter implements IAgentPort {

  public async runAnalysis(model: AgentRequest): Promise<AgentResponse> {
    const projectRoot      = process.cwd();
    const envFilePath      = join(projectRoot, 'src', 'agents', 'code', '.env');
    const sharedVolumeName = 'analysis_tmp_data';
    const containerDir     = `/tmp/${String(model.id.value)}`;

    const dockerArgs = [
      'run', '--rm',
      '--env-file', envFilePath,
      '-v', `${sharedVolumeName}:/tmp`,
      'strands-code-analyzer',
      containerDir,
    ];

    console.log(`[Adapter] Lancio analisi su volume condiviso: ${sharedVolumeName}`);

    const rawOutput = await this.runContainer(dockerArgs);
    const parsed    = this.extractJson(rawOutput);

    console.log('[Adapter] Risultato analisi:', JSON.stringify(parsed, null, 2));

    return new AgentResponse();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private runContainer(dockerArgs: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', dockerArgs);
      let stdout   = '';
      let stderr   = '';

      docker.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      docker.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      docker.on('error', (err: Error) => reject(err));

      docker.on('close', (code: number | null) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`Docker exit code ${String(code)}.\nStderr: ${stderr}`));
      });
    });
  }

  private extractJson(raw: string): Record<string, unknown> {
    const start = raw.indexOf('{');
    if (start === -1) throw new Error('Nessun JSON trovato nell\'output del container.');

    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{')      depth++;
      else if (raw[i] === '}') depth--;

      if (depth === 0) {
        const candidate = raw.substring(start, i + 1);
        try {
          return JSON.parse(candidate) as Record<string, unknown>;
        } catch {
          throw new Error(`JSON trovato ma non valido.\nOutput grezzo: ${raw}`);
        }
      }
    }

    throw new Error(`JSON non terminato nell\'output del container.\nOutput grezzo: ${raw}`);
  }
}

export const CODE_AGENT = Symbol('CodeAgentPort');