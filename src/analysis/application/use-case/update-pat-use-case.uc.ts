import { UpdatePatResult } from '../results/update-pat-result.result';
import { UpdatePatCommand } from '../commands/update-pat-command.command';
export interface UpdatePatUseCase {
  execute(command: UpdatePatCommand): Promise<UpdatePatResult>;
}
