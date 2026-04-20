import { GetRepositoryCollectionCommand } from '../commands/get-repository-collection-command.command';
import { GetRepositoryCollectionResult } from '../results/get-repository-collection-result.result';

export interface GetRepositoryCollectionUseCase {
  execute(command: GetRepositoryCollectionCommand): Promise<GetRepositoryCollectionResult>;
}
