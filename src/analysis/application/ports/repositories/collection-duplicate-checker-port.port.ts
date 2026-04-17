import { CheckCollectionDuplicateRequest } from '../../DTOs/models/requests/check-collection-duplicate-request.model';
import { CheckCollectionDuplicateResponse } from '../../DTOs/models/responses/check-collection-duplicate-response.model';

export interface ICollectionDuplicateCheckerPort {
  checkDuplicate(model: CheckCollectionDuplicateRequest): Promise<CheckCollectionDuplicateResponse>;
}
