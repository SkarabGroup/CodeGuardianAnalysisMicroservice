import { GetAllAnalysesForUserCommand } from '../commands/get-all-analyses-for-user-command.command';
import { GetAllAnalysesForUserResult } from '../results/get-all-analyses-for-user-result.result';
export interface GetAllAnalysesForUserUseCase {
  getAllAnalysesForUser(
    command: GetAllAnalysesForUserCommand,
  ): Promise<GetAllAnalysesForUserResult>;
}
