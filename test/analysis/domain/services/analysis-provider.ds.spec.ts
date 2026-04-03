import { v7 as uuid } from 'uuid';
import { AnalysisProvider } from '../../../../src/analysis/domain/services/analysis-provider.ds';
import { StartAnalysisCommand } from '../../../../src/analysis/application/commands/start-analysis-command.command';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { UserId } from '../../../../src/analysis/domain/value-objects/user-id.vo';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';

describe('AnalysisProvider', () => {
  const commandPublic = new StartAnalysisCommand({
    userId: uuid(),
    repositoryUrl: 'https://github.com/Suerto/Albar.git',
  });

  const commandPrivate = new StartAnalysisCommand({
    userId: uuid(),
    repositoryUrl: 'https://github.com/Suerto/Albar.git',
    patPassword: 'fotonico',
  });

  const commandBranch = new StartAnalysisCommand({
    userId: uuid(),
    repositoryUrl: 'https://github.com/Suerto/Albar.git',
    branch: 'develop',
  });

  const commandCommit = new StartAnalysisCommand({
    userId: uuid(),
    repositoryUrl: 'https://github.com/Suerto/Albar.git',
    commitHash: 'a'.repeat(40),
  });

  const provider = new AnalysisProvider();

  it('should create an instance of GitHubAnalysis', () => {
    const CommandPublic: GitHubAnalysis = provider.createGitHubAnalysisEntity(commandPublic);
    expect(CommandPublic).toBeInstanceOf(GitHubAnalysis);
    expect(CommandPublic.getAnalysisId()).toBeInstanceOf(AnalysisId);
    expect(CommandPublic.getUserId()).toBeInstanceOf(UserId);
    expect(CommandPublic.getRepoURL()).toBeInstanceOf(RepoURL);
    expect(CommandPublic.getBranch()?.value).toBe('main');
    expect(CommandPublic.getCommit()).toBeNull();

    const CommandPrivate: GitHubAnalysis = provider.createGitHubAnalysisEntity(commandPrivate);
    expect(CommandPrivate).toBeInstanceOf(GitHubAnalysis);
    expect(CommandPrivate.getAnalysisId()).toBeInstanceOf(AnalysisId);
    expect(CommandPrivate.getUserId()).toBeInstanceOf(UserId);
    expect(CommandPrivate.getRepoURL()).toBeInstanceOf(RepoURL);
    expect(CommandPrivate.getBranch()?.value).toBe('main');
    expect(CommandPrivate.getCommit()).toBeNull();

    const CommandBranch: GitHubAnalysis = provider.createGitHubAnalysisEntity(commandBranch);
    expect(CommandBranch).toBeInstanceOf(GitHubAnalysis);
    expect(CommandBranch.getAnalysisId()).toBeInstanceOf(AnalysisId);
    expect(CommandBranch.getUserId()).toBeInstanceOf(UserId);
    expect(CommandBranch.getRepoURL()).toBeInstanceOf(RepoURL);
    expect(CommandBranch.getBranch()?.value).toBe('develop');
    expect(CommandBranch.getCommit()).toBeNull();

    const CommandCommit: GitHubAnalysis = provider.createGitHubAnalysisEntity(commandCommit);
    expect(CommandCommit).toBeInstanceOf(GitHubAnalysis);
    expect(CommandCommit.getAnalysisId()).toBeInstanceOf(AnalysisId);
    expect(CommandCommit.getUserId()).toBeInstanceOf(UserId);
    expect(CommandCommit.getRepoURL()).toBeInstanceOf(RepoURL);
    expect(CommandCommit.getBranch()?.value).toBeUndefined();
    expect(CommandCommit.getCommit()).toBeInstanceOf(CommitHash);
  });
});
