import { AnalysisFactoryCommand } from './analysis-factory-command.command';
import { AnalysisType } from '../../domain/enums/analysis-type.enum';

export class GitHubAnalysisCommand extends AnalysisFactoryCommand {
  public constructor(
    userId: string,
    public readonly repoURL: string,
    public readonly branch: string = 'main',
    public readonly commit?: string,
  ) {
    super(userId, AnalysisType.GITHUB);
  }
}
