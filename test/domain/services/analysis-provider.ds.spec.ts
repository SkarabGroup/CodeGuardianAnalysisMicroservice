import { GitHubAnalysisCommand } from '../../../src/application/commands/github-analysis-factory-command.command';
import { AnalysisProvider } from '../../../src/domain/services/analysis-provider.ds';
import { v4 as uuid } from 'uuid';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';

describe('AnalysisProvider', () => {
  describe('Success Cases', () => {
    it('Should create a AnalysisProvider', () => {
      expect(new AnalysisProvider()).toBeInstanceOf(AnalysisProvider);
    });

    it('Should create a GitHubAnalysis without commit', () => {
      const command = new GitHubAnalysisCommand(
        uuid(),
        'https://github.com/Suerto/Albar.git',
        'develop',
      );

      expect(new AnalysisProvider().create(command)).toBeInstanceOf(GitHubAnalysis);
    });

    it('Should create a GitHubAnalysis with commit', () => {
      const command = new GitHubAnalysisCommand(
        uuid(),
        'https://github.com/Suerto/Albar.git',
        'main',
        'a'.repeat(40),
      );

      expect(new AnalysisProvider().create(command)).toBeInstanceOf(GitHubAnalysis);
    });
  });

  describe('Failure Cases', () => {
    it('Should not create a GitHubAnalysis', () => {
      const fakeCommand = {
        id: uuid(),
        type: 'fake',
        repoURL: 'https://github.com/Fake/Command.git',
        branch: 'develop',
      } as unknown as GitHubAnalysisCommand;

      expect(() => new AnalysisProvider().create(fakeCommand)).toThrow(
        'Analysis type not supported',
      );
    });
  });
});
