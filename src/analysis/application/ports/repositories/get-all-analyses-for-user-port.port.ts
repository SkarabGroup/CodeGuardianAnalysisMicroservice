import { GetAllAnalysesForUserResponse } from '../../../application/DTOs/models/responses/get-all-analyses-for-user-response.model';
import { UserId } from '../../../domain/value-objects/user-id.vo';
export interface IGetAllAnalysesForUserPort {
  getAllAnalysesForUser(id: UserId): Promise<GetAllAnalysesForUserResponse>;
}
