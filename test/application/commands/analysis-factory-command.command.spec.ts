import { GitHubAnalysisCommand } from '../../../src/application/commands/github-analysis-factory-command.command';
import { AnalysisType } from '../../../src/domain/enums/analysis-type.enum';
import { v4 as uuid } from 'uuid';

describe('GitHubAnalysisCommand', () => {
  const userId = uuid();
  const repoURL = 'https://github.com/user/repo.git';

  it('should create a command with all provided values', () => {
    const branch = 'develop';
    const commit = 'a1b2c3d';

    const command = new GitHubAnalysisCommand(userId, repoURL, branch, commit);

    expect(command.userId).toBe(userId);
    expect(command.repoURL).toBe(repoURL);
    expect(command.branch).toBe(branch);
    expect(command.commit).toBe(commit);
    expect(command.type).toBe(AnalysisType.GITHUB);
  });

  it('should apply the default branch "main" when not provided', () => {
    const command = new GitHubAnalysisCommand(userId, repoURL);

    expect(command.branch).toBe('main');
    expect(command.commit).toBeUndefined();
  });
});
