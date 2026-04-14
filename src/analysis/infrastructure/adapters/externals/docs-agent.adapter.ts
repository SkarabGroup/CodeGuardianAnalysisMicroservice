import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import { DocsAgentResponse } from '../../../application/DTOs/models/responses/docs-agent-response-model.model';
import { IDocumentationAgentPort } from '../../../application/ports/externals/docs-agent-port.port';

@Injectable()
export class DocumentationAnalysisAdapter implements IDocumentationAgentPort {
  public async runAnalysis(model: AgentRequest): Promise<DocsAgentResponse> {
    const projectRoot = process.cwd();
    const envFilePath = join(projectRoot, 'src', 'agents', 'documentation', '.env');
    const sharedVolumeName = 'analysis_tmp_data';

    const repoSubPath = model.id.value.trim();
    const repoPathInContainer = `/tmp/${repoSubPath}`;

    const dockerArgs = [
      'run',
      '--rm',
      '--env-file',
      envFilePath,
      '-v',
      `${sharedVolumeName}:/tmp`,
      '--entrypoint',
      'sh',
      'strands-documentation-analyzer',
      '-c',
      `python3 /app/test.py "${repoPathInContainer}"`,
    ];

    console.log(
      `[Adapter] Lancio analisi su volume: ${sharedVolumeName}, repo: ${repoPathInContainer}`,
    );

    try {
      await new Promise<void>((resolve, reject) => {
        const dockerProcess = spawn('docker', dockerArgs, { stdio: 'inherit' });
        dockerProcess.on('error', reject);
        dockerProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Exit code: ${code}`));
          }
        });
      });

      return new DocsAgentResponse(true, [], [], [], null);
    } catch (error) {
      console.error(`[Adapter] Analisi fallita:`, error);
      return new DocsAgentResponse(false, [], [], [], null, (error as Error).message);
    }
  }
}

export const DOCS_AGENT = Symbol('DocumentationAgentPort');
