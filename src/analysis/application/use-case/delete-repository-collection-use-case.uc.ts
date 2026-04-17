import { DeleteRepositoryCollectionCommand } from '../commands/delete-repository-collection-command.command';
import { DeleteRepositoryCollectionResult } from '../results/delete-repository-collection-result.result';

export interface DeleteRepositoryCollectionUseCase {
  execute(command: DeleteRepositoryCollectionCommand): Promise<DeleteRepositoryCollectionResult>;
}
