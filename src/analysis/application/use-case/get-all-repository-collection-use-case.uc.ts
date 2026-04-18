import { GetAllRepositoryCollectionsCommand } from '../commands/get-all-repository-collections-command.command';
import { GetAllRepositoryCollectionsResult } from '../results/getl-all-repository-collection-result.result';

export interface GetAllRepositoryCollectionsUseCase {
  executeAll(
    command: GetAllRepositoryCollectionsCommand,
  ): Promise<GetAllRepositoryCollectionsResult>;
}
