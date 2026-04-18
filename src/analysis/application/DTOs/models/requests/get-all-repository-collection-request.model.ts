import { UserId } from '../../../../domain/value-objects/user-id.vo';

export class GetAllRepositoryCollectionsRequest {
  constructor(public readonly user: UserId) {}
}
