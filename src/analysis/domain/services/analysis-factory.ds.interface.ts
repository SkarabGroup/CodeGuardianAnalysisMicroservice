import { StartAnalysisCommand } from '../../application/commands/start-analysis-command.command';
import { GitHubAnalysis } from '../entities/github-analysis.entity';

export interface IAnalysisFactory {
  createGitHubAnalysisEntity(command: StartAnalysisCommand): GitHubAnalysis;
}
