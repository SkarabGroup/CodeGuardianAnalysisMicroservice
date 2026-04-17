import { DeleteRepositoryCollectionRequest } from '../../DTOs/models/requests/delete-repository-collection-request.model';
import { DeleteRepositoryCollectionResponse } from '../../DTOs/models/responses/delete-repository-collection-response.model';

export interface IDeleteRepositoryCollectionPort {
  deleteCollection(
    model: DeleteRepositoryCollectionRequest,
  ): Promise<DeleteRepositoryCollectionResponse>;
}
