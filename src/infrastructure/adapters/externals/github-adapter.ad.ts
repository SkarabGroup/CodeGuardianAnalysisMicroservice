import { exec } from 'child_process';
import { promisify } from 'util';
import { GitAccessRequestModel } from '../../../../src/application/DTOs/models/git-access-request-model.model';
import { IGitValidatorPort } from '../../../../src/application/ports/externals/i-git-validator-port.port';
import { GitAccessRequestResult } from '../../../../src/application/DTOs/results/git-access-request-result.result';

type ExecAsync = (command: string) => Promise<{ stdout: string; stderr: string }>;

interface GitHubBranchResponse {
  name?: string;
}

export class GitHubAdapter implements IGitValidatorPort {
  private readonly execAsync: ExecAsync;

  constructor(execAsync?: ExecAsync) {
    this.execAsync = execAsync ?? (promisify(exec) as ExecAsync); // Allows injection of a mock exec function for testing
  }

  async validateRequest(request: GitAccessRequestModel): Promise<GitAccessRequestResult> {
    const curlCommand = this.buildAccessRequestCurl(request);

    try {
      const { stdout, stderr } = await this.execAsync(curlCommand);

      if (stderr) {
        console.error(`curl stderr: ${stderr}`);
        return new GitAccessRequestResult('UNAVAILABLE');
      }

      return this.parseResponse(stdout, request.commitHash !== null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error executing curl: ${message}`);
      return new GitAccessRequestResult('UNAVAILABLE');
    }
  }

  // Curl builder

  private buildAccessRequestCurl(request: GitAccessRequestModel): string {
    const parts: string[] = ['curl', '--silent'];

    parts.push('--write-out "\\n%{http_code}"'); //to add the status code at the end of the response for easier parsing

    if (request.personalAccessToken) {
      parts.push(`-H "Authorization: Bearer ${request.personalAccessToken}"`);
    }

    const acceptHeader = request.commitHash
      ? 'application/vnd.github.sha'
      : 'application/vnd.github+json';

    parts.push(`-H "Accept: ${acceptHeader}"`);
    parts.push(this.buildUrl(request));

    console.debug(`Executing curl command: ${parts.join(' ')}`);
    return parts.join(' ');
  }

  private buildUrl(request: GitAccessRequestModel): string {
    const repoPath = this.extractRepoPath(request.repositoryUrl);

    return request.commitHash
      ? `https://api.github.com/repos/${repoPath}/commits/${request.commitHash}`
      : `https://api.github.com/repos/${repoPath}/branches/${request.branchName}`;
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
  private parseResponse(stdout: string, isCommitRequest: boolean): GitAccessRequestResult {
    const trimmed = stdout.trim();

    if (!trimmed) {
      console.error('Curl output is empty');
      return new GitAccessRequestResult('UNAVAILABLE');
    }

    const lines = trimmed.split('\n');

    const lastLine = lines.at(-1)!; //! to assert that there is at least one line, which should be the status code, otherwise it would have been caught by the empty check above. This is necessary to satisfy TypeScript's type system and avoid a potential undefined value when accessing lines.at(-1).

    const statusCode = parseInt(lastLine, 10);
    const body = lines.slice(0, -1).join('\n');

    switch (statusCode) {
      case 200:
        return this.validateBody(body, isCommitRequest);
      case 401:
        return new GitAccessRequestResult('UNAUTHORIZED');
      case 404:
        return new GitAccessRequestResult('NOT_FOUND');
      default:
        console.error(`Unexpected GitHub status code: ${statusCode} — body: ${body}`);
        return new GitAccessRequestResult('UNAVAILABLE');
    }
  }

  /**
   * A 200 on the SHA endpoint returns a raw 40-char hex string.
   * A 200 on the branch endpoint returns a JSON object with a `name` field.
   */
  private validateBody(body: string, isCommitRequest: boolean): GitAccessRequestResult {
    if (isCommitRequest) {
      const isSha = /^[0-9a-f]{40}$/i.test(body.trim()); // 40-char hex string validation (case insensitive) and trimming to remove any whitespace/newline characters
      return isSha
        ? new GitAccessRequestResult('EXISTS')
        : new GitAccessRequestResult('UNAVAILABLE');
    }

    try {
      const data = JSON.parse(body) as GitHubBranchResponse;
      return data.name
        ? new GitAccessRequestResult('EXISTS')
        : new GitAccessRequestResult('NOT_FOUND');
    } catch {
      console.error(`Failed to parse GitHub JSON response: ${body}`);
      return new GitAccessRequestResult('UNAVAILABLE');
    }
  }
}
