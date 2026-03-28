import { GitRequestDomainResult } from '../../domain/enums/git-request-result.enum';
import { GitRequestResult, GitRequestStatus } from '../DTOs/results/git-request-result.result';

export class GitRequestResultMapper {
  public static toDomain(result: GitRequestResult): GitRequestStatus {
    return GitRequestDomainResult[result.status as keyof typeof GitRequestDomainResult];
  }
}
