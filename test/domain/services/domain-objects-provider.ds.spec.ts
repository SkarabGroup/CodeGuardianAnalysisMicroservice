import { v7 as uuid } from 'uuid';
import { DomainObjectsProvider } from '../../../src/domain/services/domain-objects-provider.ds';
import { StartAnalysisCommand } from '../../../src/application/commands/start-analysis-command.command';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { AnalysisId } from '../../../src/domain/value-objects/analysis-id.vo';
import { UserId } from '../../../src/domain/value-objects/user-id.vo';
import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';
import { CommitHash } from '../../../src/domain/value-objects/commit-hash.vo';
import { PATPassword } from '../../../src/domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../src/domain/value-objects/personal-access-token.vo';

describe('DomainObjectsProvider', () => {
  const commandPublic = new StartAnalysisCommand(uuid(), 'https://github.com/Suerto/Albar.git');

  const commandPrivate = new StartAnalysisCommand(
    uuid(),
    'https://github.com/Suerto/Albar.git',
    'fotonico',
  );

  const commandBranch = new StartAnalysisCommand(
    uuid(),
    'https://github.com/Suerto/Albar.git',
    undefined,
    'develop',
  );

  const commandCommit = new StartAnalysisCommand(
    uuid(),
    'https://github.com/Suerto/Albar.git',
    undefined,
    undefined,
    'a'.repeat(40),
  );

  const provider = new DomainObjectsProvider();

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

  describe('Secret Value Objects Generation', () => {
    it('should create a valid PATPassword VO', () => {
      const rawPassword = 'a'.repeat(64);
      const vo = provider.createPATPasswordVO(rawPassword);

      expect(vo).toBeInstanceOf(PATPassword);
      expect(vo.value).toBe(rawPassword);
    });

    it('should create a valid PersonalAccessToken VO', () => {
      const rawToken = 'ghp_' + 'a'.repeat(36);
      const vo = provider.createPersonalAccessTokenVO(rawToken);

      expect(vo).toBeInstanceOf(PersonalAccessToken);
      expect(vo.value).toBe(rawToken);
    });
  });
});
