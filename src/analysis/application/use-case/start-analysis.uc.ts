import { StartAnalysisCommand } from '../commands/start-analysis-command.command';
import { StartAnalysisResult } from '../results/start-analysis-result.result';

export interface StartAnalysisUseCase {
  execute(command: StartAnalysisCommand): Promise<StartAnalysisResult>;
}
