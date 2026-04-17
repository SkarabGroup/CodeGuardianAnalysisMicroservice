import { GetRepositoryCollectionRequest } from '../../DTOs/models/requests/get-repository-collection-request.model';
import { GetRepositoryCollectionResponse } from '../../DTOs/models/responses/get-repository-collection-response.model';

export interface IGetRepositoryCollectionPort {
  getRepositoryCollection(
    model: GetRepositoryCollectionRequest,
  ): Promise<GetRepositoryCollectionResponse>;
}
