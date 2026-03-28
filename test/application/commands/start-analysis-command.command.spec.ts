import { StartAnalysisCommand } from '../../../src/application/commands/start-analysis-command.command';
import { v4 as uuidv4 } from 'uuid';

describe('StartAnalysisCommand', () => {
  const userId = uuidv4();
  const repositoryUrl = 'https://github.com/user/repo.git';

  it('should create a command with all provided values', () => {
    const branch = 'develop';
    const commitHash = 'a1b2c3d4e5f6g7h8i9j0';
    const patPassword = 'ghp_token123';

    const command = new StartAnalysisCommand(
      userId,
      repositoryUrl,
      branch,
      commitHash,
      patPassword,
    );

    expect(command.userId).toBe(userId);
    expect(command.repositoryUrl).toBe(repositoryUrl);
    expect(command.branch).toBe(branch);
    expect(command.commitHash).toBe(commitHash);
    expect(command.patPassword).toBe(patPassword);
  });

  it('should apply the default branch "main" when not provided', () => {
    const command = new StartAnalysisCommand(userId, repositoryUrl, undefined, null, null);

    expect(command.branch).toBe('main');
  });

  it('should set commitHash and patPassword to null when not provided', () => {
    const command = new StartAnalysisCommand(userId, repositoryUrl, undefined, null, null);

    expect(command.commitHash).toBeNull();
    expect(command.patPassword).toBeNull();
  });
});
