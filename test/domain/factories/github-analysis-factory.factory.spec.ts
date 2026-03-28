import { GitHubAnalysisFactory } from '../../../src/domain/factories/github-analysis-factory.factory';
import { GitHubAnalysisCommand } from '../../../src/application/commands/github-analysis-factory-command.command';
import { GitHubAnalysis } from '../../../src/domain/entities/github-analysis.entity';
import { AnalysisType } from '../../../src/domain/enums/analysis-type.enum';
import { v4 as uuid } from 'uuid';

describe('GitHubAnalysisFactory', () => {
  let factory: GitHubAnalysisFactory;

  beforeEach(() => {
    factory = new GitHubAnalysisFactory();
  });

  describe('supports()', () => {
    it('should return true for GITHUB type', () => {
      expect(factory.supports(AnalysisType.GITHUB)).toBe(true);
    });
  });

  describe('create()', () => {
    it('should create a valid GitHubAnalysis from a valid command', () => {
      const command = new GitHubAnalysisCommand(
        uuid(),
        'https://github.com/Suerto/QtLibrary.git',
        'main',
      );

      const result = factory.create(command) as GitHubAnalysis;

      expect(result).toBeInstanceOf(GitHubAnalysis);
      expect(result.getRepoURL().value).toBe(command.repoURL);
      expect(result.getBranch().value).toBe(command.branch);
    });

    it('should create a valid GitHubAnalysis from a valid command with commit', () => {
      const command = new GitHubAnalysisCommand(
        uuid(),
        'https://github.com/Suerto/QtLibrary.git',
        'main',
        'a'.repeat(40),
      );

      const result = factory.create(command) as GitHubAnalysis;

      expect(result).toBeInstanceOf(GitHubAnalysis);
      expect(result.getRepoURL().value).toBe(command.repoURL);
      expect(result.getBranch().value).toBe(command.branch);
      expect(result.getCommit()?.value).toBe(command.commit);
    });
    it('should throw if the command is not a GitHubAnalysisCommand', () => {
      const wrongCommand = { userId: '123' } as unknown as GitHubAnalysisCommand;
      expect(() => factory.create(wrongCommand)).toThrow(
        'GitHubAnalysisFactory must receive a GitHubAnalysisCommand',
      );
    });

    it('should fail if repoURL string is invalid', () => {
      const command = new GitHubAnalysisCommand(uuid(), 'not-a-url');
      expect(() => factory.create(command)).toThrow();
    });
  });
});
