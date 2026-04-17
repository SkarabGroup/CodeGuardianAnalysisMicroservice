import { AddRepositoryCollectionRequest } from '../../DTOs/models/requests/add-repository-collection-request.model';
import { AddRepositoryCollectionResponse } from '../../DTOs/models/responses/add-repository-collection-response.model.model';

export interface ICollectionAdderPort {
  addCollection(model: AddRepositoryCollectionRequest): Promise<AddRepositoryCollectionResponse>;
}
