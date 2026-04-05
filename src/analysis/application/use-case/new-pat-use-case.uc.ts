import { NewPatCommand } from '../commands/new-pat-command.command';
import { NewPatResult } from '../results/new-pat-result.result';

export interface NewPatUseCase {
  execute(command: NewPatCommand): Promise<NewPatResult>;
}
