import { GitRequestDomainResult } from '../../domain/enums/git-request-result.enum';
import { GitAccessRequestResult } from '../DTOs/results/git-access-request-result.result';

export class GitRequestResultMapper {
  public static toDomain(result: GitAccessRequestResult): GitRequestDomainResult {
    return GitRequestDomainResult[result.status as keyof typeof GitRequestDomainResult];
  }
}
