import { AddRepositoryCollectionCommand } from '../commands/add-repository-collection-command.command';
import { AddRepositoryCollectionResult } from '../results/add-repository-collection-result.result';

export interface AddRepositoryCollectionUseCase {
  execute(command: AddRepositoryCollectionCommand): Promise<AddRepositoryCollectionResult>;
}
