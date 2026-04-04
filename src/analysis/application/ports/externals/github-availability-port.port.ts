import { CheckAvailabilityRequest } from '../../DTOs/models/requests/check-availability-request-model.model';
import { CheckAvailabilityResponse } from '../../DTOs/models/responses/check-availability-response-model.model';

export interface IGitHubAvailabilityPort {
  check(model: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse>;
}
