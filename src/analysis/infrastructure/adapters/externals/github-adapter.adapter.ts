import { exec } from 'child_process';
import { promisify } from 'util';

import { CheckAvailabilityRequest } from '../../../application/DTOs/models/requests/check-availability-request-model.model';
import { CheckAvailabilityResponse } from '../../../application/DTOs/models/responses/check-availability-response-model.model';
import { IGitHubAvailabilityPort } from '../../../application/ports/externals/github-availability-port.port';

import { CloneRepoRequest } from '../../../application/DTOs/models/requests/clone-repo-request-model.model';
import { CloneRepoResponse } from '../../../application/DTOs/models/responses/clone-repo-response-model.model';
import { IGitClonePort } from '../../../application/ports/externals/github-clone-port.port';
import { debug } from 'console';
import { config } from 'dotenv';
config();

type ExecAsync = (command: string) => Promise<{ stdout: string; stderr: string }>; // Type definition for the promisified exec function

interface GitHubBranchResponse {
  name?: string;
  commit?: {
    sha: string;
  };
}

export class GitHubAdapter implements IGitHubAvailabilityPort, IGitClonePort {
  private readonly execAsync: ExecAsync;

  constructor(execAsync?: ExecAsync) {
    this.execAsync = execAsync ?? (promisify(exec) as ExecAsync);
  }

  async check(request: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse> {
    const curlCommand = this.buildAccessRequestCurl(request);

    try {
      const { stdout, stderr } = await this.execAsync(curlCommand);

      if (stderr) {
        console.error(`curl stderr: ${stderr}`);
        return CheckAvailabilityResponse.failure('An error occurred while checking availability.');
      }

      return this.parseResponse(stdout, request.commit !== null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error executing curl: ${message}`);
      return CheckAvailabilityResponse.failure('An error occurred while checking availability.');
    }
  }

  // Curl builder

  private buildAccessRequestCurl(request: CheckAvailabilityRequest): string {
    const parts: string[] = ['curl', '--silent'];

    parts.push('--write-out "\\n%{http_code}"'); //to add the status code at the end of the response for easier parsing

    if (request.patToken) {
      parts.push(`-H "Authorization: Bearer ${request.patToken.value}"`);
    }

    const acceptHeader = request.commit
      ? 'application/vnd.github.sha'
      : 'application/vnd.github+json'; // if the commit is null (branch request)

    parts.push(`-H "Accept: ${acceptHeader}"`);
    parts.push(this.buildUrl(request));

    console.debug(`Executing curl command: ${parts.join(' ')}`);
    return parts.join(' ');
  }

  private buildUrl(request: CheckAvailabilityRequest): string {
    const repoPath = this.extractRepoPath(request.repoUrl.value);

    return request.commit
      ? `https://api.github.com/repos/${repoPath}/commits/${request.commit.value}`
      : `https://api.github.com/repos/${repoPath}/branches/${request.branch?.value}`;
  }

  private extractRepoPath(repositoryUrl: string): string {
    return repositoryUrl.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  }

  // Response parsing

  /**
   * stdout format (--write-out "\n%{http_code}"):
   *
   *   <body>
   *   <status_code>
   */

  //this.parseResponse(stdout, request.commit !== null);

  private parseResponse(stdout: string, isCommitRequest: boolean): CheckAvailabilityResponse {
    const trimmed = stdout.trim();

    if (!trimmed) {
      console.error('Curl output is empty');
      return CheckAvailabilityResponse.failure(
        'The response from GitHub was empty, which is unexpected.',
      ); // This case should be rare, but it's good to handle it explicitly to avoid confusion and provide a clearer error message.
    }

    const lines = trimmed.split('\n');

    const lastLine = lines.at(-1)!; //! to assert that there is at least one line, which should be the status code, otherwise it would have been caught by the empty check above. This is necessary to satisfy TypeScript's type system and avoid a potential undefined value when accessing lines.at(-1).

    const statusCode = parseInt(lastLine, 10);
    const body = lines.slice(0, -1).join('\n');

    switch (statusCode) {
      case 200:
        return this.validateBody(body, isCommitRequest);
      case 404:
        return new CheckAvailabilityResponse(false, null, 'The requested resource was not found.');
      default:
        console.error(`Unexpected GitHub status code: ${statusCode} — body: ${body}`);
        return new CheckAvailabilityResponse(
          false,
          null,
          'An unexpected error occurred while checking availability.',
        );
    }
  }

  /**
   * A 200 on the SHA endpoint returns a raw 40-char hex string.
   * A 200 on the branch endpoint returns a JSON object with a `name` field.
   */
  private validateBody(body: string, isCommitRequest: boolean): CheckAvailabilityResponse {
    if (isCommitRequest) {
      const isSha = /^[0-9a-f]{40}$/i.test(body.trim()); // 40-char hex string validation (case insensitive) and trimming to remove any whitespace/newline characters
      return isSha
        ? new CheckAvailabilityResponse(true, body.trim(), 'Completed successfully.')
        : new CheckAvailabilityResponse(false, null, 'The requested commit was not found.');
    }

    try {
      const data = JSON.parse(body) as GitHubBranchResponse;
      return data.name
        ? new CheckAvailabilityResponse(true, data.commit?.sha ?? null, 'Completed successfully.')
        : new CheckAvailabilityResponse(false, null, 'The requested branch was not found.');
    } catch {
      console.error(`Failed to parse GitHub JSON response: ${body}`);
      return new CheckAvailabilityResponse(false, null, 'Failed to parse GitHub JSON response.');
    }
  }

  public async clone(request: CloneRepoRequest): Promise<CloneRepoResponse> {
    const { stderr: availabilityStderr } = await this.execAsync(
      `rm -rf /tmp/${request.analysisId.value}`,
    );
    const { stderr: mkdirStderr } = await this.execAsync(`mkdir /tmp/${request.analysisId.value}`); // Ensure the target directory exists before cloning

    if (mkdirStderr || availabilityStderr) {
      console.error(`Failed to create directory: ${mkdirStderr || availabilityStderr}`);
      return CloneRepoResponse.failure('Failed to create target directory for cloning.'); // This should be a rare case, but it's good to handle it explicitly to avoid confusion and provide a clearer error message.
    }

    const authPart = request.patToken
      ? `https://${request.patToken.value}@`
      : `https://${process.env.CODE_GUARDIAN_TOKEN}@`;
    const repoPath = request.repoUrl.value
      .replace(/^https:\/\/github\.com\//, '')
      .replace(/\.git$/, '');
    const repoUrlWithAuth = `${authPart}github.com/${repoPath}`;

    const branchPart = request.branch ? `--branch ${request.branch.value}` : '';
    const command = `git clone --quiet ${branchPart} ${repoUrlWithAuth} /tmp/${request.analysisId.value}`;

    debug(`Executing git clone command: ${command}`);
    try {
      await this.execAsync(command);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error executing git clone: ${message}`);
      await this.execAsync(`rm -rf /tmp/${request.analysisId.value}`); //clean up
      return CloneRepoResponse.failure('Failed to clone repository.'); // This should be a rare case, but it's good to handle it explicitly to avoid confusion and provide a clearer error message.
    }

    if (request.commit) {
      const checkoutCommand = `git -C /tmp/${request.analysisId.value} checkout --quiet ${request.commit.value}`;

      try {
        await this.execAsync(checkoutCommand);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'stderr' in error) {
          const stderr = (error as { stderr: string }).stderr;
          console.error(`Git checkout stderr: ${stderr}`);
        } else {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Unknown error during checkout: ${message}`);
        }

        await this.execAsync(`rm -rf /tmp/${request.analysisId.value}`);
        return CloneRepoResponse.failure('Failed to checkout commit.');
      }
    }
    return CloneRepoResponse.success(`/tmp/${request.analysisId.value}`);
  }
}

export const AVAILABILITY_PORT = Symbol('IGitHubAvailabilityPort');
export const CLONING_PORT = Symbol('IGitClonePort');
