import { GitHubAnalysisCommand } from '../../../src/application/commands/github-analysis-factory-command.command';
import { AnalysisType } from '../../../src/domain/enums/analysis-type.enum';
import { v4 as uuidv4 } from 'uuid';

describe('GitHubAnalysisCommand', () => {
  const userId = uuidv4();
  const repoURL = 'https://github.com/user/repo.git';

  it('should create a command with all provided values', () => {
    const branch = 'develop';
    const commit = 'a1b2c3d4e5f6g7h8i9j0';

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

  it('should correctly inherit properties from AnalysisFactoryCommand', () => {
    const command = new GitHubAnalysisCommand(userId, repoURL);

    expect(command.type).toBe(AnalysisType.GITHUB);
    expect(command.userId).toBe(userId);
  });
});
