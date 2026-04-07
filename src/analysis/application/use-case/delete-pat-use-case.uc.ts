import { DeletePatCommand } from '../commands/delete-pat-command.command';
import { DeletePatResult } from '../results/delete-pat-result.result';

export interface DeletePatUseCase {
  execute(command: DeletePatCommand): Promise<DeletePatResult>;
}
