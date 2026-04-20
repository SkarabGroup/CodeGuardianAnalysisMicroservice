import { GetAnalysisFromIdCommand } from '../commands/get-analysis-from-id.command';
import { GetAnalysisResult } from '../results/get-analysis-result.result';
export interface GetAnalysisUseCase {
  execute(command: GetAnalysisFromIdCommand): Promise<GetAnalysisResult>;
}
