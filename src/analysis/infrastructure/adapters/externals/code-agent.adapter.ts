import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { IAgentPort } from '../../../application/ports/externals/agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import { AgentResponse } from '../../../application/DTOs/models/responses/agent-response-model.model';

@Injectable()
export class CodeAnalysisAdapter implements IAgentPort {
  public async runAnalysis(model: AgentRequest): Promise<AgentResponse> {
    const projectRoot = process.cwd();

    const envFilePath = join(projectRoot, 'src', 'agents', 'code', '.env');

    const sharedVolumeName = 'analysis_tmp_data';

    const containerDir = `/tmp/${model.id.value}`;

    const dockerArgs = [
      'run',
      '--rm',
      '--env-file',
      envFilePath,
      '-v',
      `${sharedVolumeName}:/tmp`,
      'strands-code-analyzer',
      containerDir,
    ];

    console.log(`[Adapter] Lancio analisi su volume condiviso: ${sharedVolumeName}`);

    try {
      await new Promise<void>((resolve, reject) => {
        const dockerProcess = spawn('docker', dockerArgs, { stdio: 'inherit' });

        dockerProcess.on('error', (err) => {
          reject(err);
        });

        dockerProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else reject(new Error(`Exit code: ${code}`));
        });
      });

      return new AgentResponse();
    } catch (error) {
      console.error(`[Adapter] Analisi fallita:`, error);
      return new AgentResponse();
    }
  }
}

export const CODE_AGENT = Symbol('CodeAgentPort');
