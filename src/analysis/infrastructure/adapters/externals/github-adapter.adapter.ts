import { exec } from 'child_process';
import { promisify } from 'util';
import { CheckAvailabilityRequest } from '../../../application/DTOs/models/requests/check-availability-request-model.model';
import { CheckAvailabilityResponse } from '../../../application/DTOs/models/responses/check-availability-response-model.model';
import { IGitHubAvailabilityPort } from '../../../application/ports/externals/github-availability-port.port';
import { CloneRepoRequest } from '../../../application/DTOs/models/requests/clone-repo-request-model.model';
import { CloneRepoResponse } from '../../../application/DTOs/models/responses/clone-repo-response-model.model';
import { IGitClonePort } from '../../../application/ports/externals/github-clone-port.port';
import { config } from 'dotenv';

config();

type ExecAsync = (command: string) => Promise<{ stdout: string; stderr: string }>;

interface GitHubBranchResponse {
  name?: string;
  commit?: {
    sha: string;
  };
  default_branch?: string;
}

export class GitHubAdapter implements IGitHubAvailabilityPort, IGitClonePort {
  private readonly execAsync: ExecAsync;

  constructor(execAsync?: ExecAsync) {
    this.execAsync = execAsync ?? (promisify(exec) as ExecAsync);
  }

  async check(request: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse> {
    const curlCommand = this.buildAccessRequestCurl(request);

    try {
      const { stdout } = await this.execAsync(curlCommand);
      return this.parseResponse(stdout, request);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error executing curl: ${message}`);
      return CheckAvailabilityResponse.failure('An error occurred while checking availability.');
    }
  }

  private buildAccessRequestCurl(request: CheckAvailabilityRequest): string {
    const parts: string[] = ['curl', '--silent'];
    parts.push('--write-out "\\n%{http_code}"');

    if (request.patToken) {
      parts.push(`-H "Authorization: Bearer ${request.patToken.value}"`);
    }

    const acceptHeader = request.commit
      ? 'application/vnd.github.sha'
      : 'application/vnd.github+json';

    parts.push(`-H "Accept: ${acceptHeader}"`);
    parts.push(this.buildUrl(request));

    return parts.join(' ');
  }

  private buildUrl(request: CheckAvailabilityRequest): string {
    const repoPath = this.extractRepoPath(request.repoUrl.value);

    if (request.commit) {
      return `https://api.github.com/repos/${repoPath}/commits/${request.commit.value}`;
    }
    if (request.branch) {
      return `https://api.github.com/repos/${repoPath}/branches/${request.branch.value}`;
    }

    return `https://api.github.com/repos/${repoPath}`;
  }

  private extractRepoPath(repositoryUrl: string): string {
    return repositoryUrl.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  }

  private parseResponse(
    stdout: string,
    request: CheckAvailabilityRequest,
  ): CheckAvailabilityResponse {
    const trimmed = stdout.trim();
    if (!trimmed) return CheckAvailabilityResponse.failure('Empty response from GitHub.');

    const lines = trimmed.split('\n');
    const statusCode = parseInt(lines.at(-1)!, 10);
    const body = lines.slice(0, -1).join('\n').trim();

    switch (statusCode) {
      case 200:
        return this.validateBody(body, request);
      case 404:
        return CheckAvailabilityResponse.failure(
          'The requested resource (repo, branch or commit) was not found.',
        );
      default:
        return CheckAvailabilityResponse.failure(`GitHub error (Status ${statusCode})`);
    }
  }

  private validateBody(body: string, request: CheckAvailabilityRequest): CheckAvailabilityResponse {
    if (request.commit) {
      const isSha = /^[0-9a-f]{40}$/i.test(body);
      return isSha
        ? CheckAvailabilityResponse.success(request.branch?.value || 'resolved-commit', body)
        : CheckAvailabilityResponse.failure('Invalid SHA received from GitHub.');
    }

    try {
      const data = JSON.parse(body) as GitHubBranchResponse;

      if (request.branch) {
        if (data.name && data.commit?.sha) {
          return CheckAvailabilityResponse.success(data.name, data.commit.sha);
        }
        return CheckAvailabilityResponse.failure('Branch data incomplete.');
      }

      if (data.default_branch) {
        return CheckAvailabilityResponse.success(data.default_branch, null);
      }

      return CheckAvailabilityResponse.failure('Unexpected JSON structure.');
    } catch {
      return CheckAvailabilityResponse.failure('Failed to parse GitHub JSON response.');
    }
  }

  public async clone(request: CloneRepoRequest): Promise<CloneRepoResponse> {
    const tempPath = `/tmp/${request.analysisId.value}`;

    try {
      await this.execAsync(`rm -rf ${tempPath}`);

      const token = request.patToken?.value || process.env.CODE_GUARDIAN_TOKEN;
      const authPart = `${token}@`;
      const repoPath = this.extractRepoPath(request.repoUrl.value);
      const repoUrlWithAuth = `https://${authPart}github.com/${repoPath}.git`;

      if (request.commit) {
        await this.execAsync(`git clone --quiet ${repoUrlWithAuth} ${tempPath}`);
        await this.execAsync(`git -C ${tempPath} checkout --quiet ${request.commit.value}`);
      } else if (request.branch) {
        await this.execAsync(
          `git clone --quiet --depth 1 --branch ${request.branch.value} ${repoUrlWithAuth} ${tempPath}`,
        );
      } else {
        await this.execAsync(`git clone --quiet --depth 1 ${repoUrlWithAuth} ${tempPath}`);
      }

      return CloneRepoResponse.success(tempPath);
    } catch (error) {
      await this.execAsync(`rm -rf ${tempPath}`);
      const msg = error instanceof Error ? error.message : 'Clone failed';
      return CloneRepoResponse.failure(msg);
    }
  }
}

export const AVAILABILITY_PORT = Symbol('IGitHubAvailabilityPort');
export const CLONING_PORT = Symbol('IGitClonePort');
