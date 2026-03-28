import { GitRequestResultMapper } from '../../../src/application/mappers/git-request-result-mapper.mapper';
import { GitRequestResult } from '../../../src/application/DTOs/results/git-request-result.result';
import { GitRequestDomainResult } from '../../../src/domain/enums/git-request-result.enum';

describe('GitRequestResultMapper', () => {
  describe('toDomain', () => {
    it.each([
      ['EXIST', GitRequestDomainResult.EXIST],
      ['NOT_FOUND', GitRequestDomainResult.NOT_FOUND],
      ['UNAUTHORIZED', GitRequestDomainResult.UNAUTHORIZED],
      ['UNAVAILABLE', GitRequestDomainResult.UNAVAILABLE],
    ])('should map status "%s" to the corresponding domain enum value', (status, expected) => {
      const result = new GitRequestResult(status as GitRequestResult['status']);

      const mapped = GitRequestResultMapper.toDomain(result) as GitRequestDomainResult;

      expect(mapped).toBe(expected);
    });
  });
});
