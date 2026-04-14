import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  DocsAgentResponse,
  DocsAgentResponsePayload,
} from '../../../application/DTOs/models/responses/docs-agent-response-model.model';
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
      // Quote every interpolated path so the shell never word-splits them
      `python3 /app/test.py "${repoPathInContainer}"`,
    ];

    console.log(
      `[Adapter] Starting analysis on volume: ${sharedVolumeName}, repo: ${repoPathInContainer}`,
    );

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

      return new DocsAgentResponse(parsed as unknown as DocsAgentResponsePayload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`[Adapter] Critical error during execution: ${errorMessage}`);
      return this.createFallbackResponse(model.id.value);
    }
  }

  private createFallbackResponse(repository: string): DocsAgentResponse {
    return new DocsAgentResponse({
      analysis_report: {
        metadata: {
          repository: repository,
          status: 'error',
        },
        API_standard_violations: [],
        docs_discrepancies: [],
        missing_files: [],
        dependency_audit: {
          readme_defined: [],
          config_defined: [],
          missing_in_config: [],
          undocumented_in_readme: [],
          version_mismatches: [],
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
            /* Iterative scanning: ignore malformed JSON chunks and continue searching */
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

export const DOCS_AGENT = Symbol('DocumentationAgentPort');
