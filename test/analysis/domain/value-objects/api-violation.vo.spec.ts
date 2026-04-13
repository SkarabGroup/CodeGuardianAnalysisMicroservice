import { APIViolation } from '../../../../src/analysis/domain/value-objects/api-violation.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('APIViolation (Value Object)', () => {
  const VALID_PATH = PathFinding.create('src/api/users.ts');
  const VALID_SEVERITY = SeverityFinding.create('CRITICAL');
  const VALID_DESCRIPTION = DescriptionFinding.create(
    'Missing authentication on sensitive endpoint',
  );
  const VALID_RULE = 'auth-required';

  describe('Success cases', () => {
    it('should create a valid APIViolation instance', () => {
      const violation = APIViolation.create(
        VALID_PATH,
        VALID_RULE,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(violation).toBeDefined();
      expect(violation).toBeInstanceOf(APIViolation);
    });

    it('should return true for equal objects', () => {
      const v1 = APIViolation.create(VALID_PATH, VALID_RULE, VALID_SEVERITY, VALID_DESCRIPTION);
      const v2 = APIViolation.create(
        PathFinding.create('src/api/users.ts'),
        'auth-required',
        SeverityFinding.create('CRITICAL'),
        DescriptionFinding.create('Missing authentication on sensitive endpoint'),
      );

      expect(v1.equals(v2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const violation = APIViolation.create(
        VALID_PATH,
        VALID_RULE,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(violation.getPathFinding()).toBe(VALID_PATH);
      expect(violation.getRule()).toBe(VALID_RULE);
      expect(violation.getSeverityFinding()).toBe(VALID_SEVERITY);
      expect(violation.getDescriptionFinding()).toBe(VALID_DESCRIPTION);
    });

    it('should trim the rule string when creating an instance', () => {
      const violation = APIViolation.create(
        VALID_PATH,
        '  auth-required  ',
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(violation.getRule()).toBe('auth-required');
    });
  });

  describe('Failure cases', () => {
    it('should throw if rule is empty', () => {
      expect(() => APIViolation.create(VALID_PATH, '', VALID_SEVERITY, VALID_DESCRIPTION)).toThrow(
        'Rule must be a non-empty string',
      );
    });

    it('should throw if rule is only whitespace', () => {
      expect(() =>
        APIViolation.create(VALID_PATH, '   ', VALID_SEVERITY, VALID_DESCRIPTION),
      ).toThrow('Rule must be a non-empty string');
    });

    it('should throw if pathFinding is invalid', () => {
      expect(() =>
        APIViolation.create(
          {} as unknown as PathFinding,
          VALID_RULE,
          VALID_SEVERITY,
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if severity is invalid', () => {
      expect(() =>
        APIViolation.create(
          VALID_PATH,
          VALID_RULE,
          {} as unknown as SeverityFinding,
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid SeverityFinding');
    });

    it('should throw if description is invalid', () => {
      expect(() =>
        APIViolation.create(
          VALID_PATH,
          VALID_RULE,
          VALID_SEVERITY,
          {} as unknown as DescriptionFinding,
        ),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should return false for different objects', () => {
      const v1 = APIViolation.create(VALID_PATH, VALID_RULE, VALID_SEVERITY, VALID_DESCRIPTION);

      const v2 = APIViolation.create(
        VALID_PATH,
        'different-rule',
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(v1.equals(v2)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const violation = APIViolation.create(
        VALID_PATH,
        VALID_RULE,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(() => violation.equals(null)).toThrow('Invalid argument');
      expect(() => violation.equals({})).toThrow('Invalid argument');
    });
  });
});
