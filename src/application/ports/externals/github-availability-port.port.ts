import { CheckAvailabilityRequestModel } from '../../DTOs/models/requests/check-availability-request-model.model';
import { CheckAvailabilityResponseModel } from '../../DTOs/models/responses/check-availability-response-model.model';

export interface IGitHubAvailabilityPort {
  check(model: CheckAvailabilityRequestModel): Promise<CheckAvailabilityResponseModel>;
}
