import { GetAllRepositoryCollectionsRequest } from '../../DTOs/models/requests/get-all-repository-collection-request.model';
import { GetAllRepositoryCollectionsResponse } from '../../DTOs/models/responses/get-all-repository-collections-response.model';

export interface IGetAllRepositoryCollectionsPort {
  getAllCollections(
    model: GetAllRepositoryCollectionsRequest,
  ): Promise<GetAllRepositoryCollectionsResponse>;
}
