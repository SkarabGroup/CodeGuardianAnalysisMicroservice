import { SecretFinding } from '../../../../src/analysis/domain/value-objects/secret-finding.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { ErrorFinding } from '../../../../src/analysis/domain/value-objects/error-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';

describe('SecretFinding (Value Object)', () => {
  const PATH = PathFinding.create('src/app/last-login-ip/last-login-ip.component.spec.ts');
  const DESCRIPTION = DescriptionFinding.create('JWT token');
  const SEVERITY = SeverityFinding.create('HIGH');
  const ERROR = ErrorFinding.create(10, DESCRIPTION, SEVERITY);

  const CATEGORY = 'jwt-token';
  const RULE_ID = 'generic-api-key';
  const REMEDIATION = DescriptionFinding.create('Move the token to an environment variable');

  describe('Success cases', () => {
    it('should create a valid SecretFinding', () => {
      const finding = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      expect(finding).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const finding = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);

      expect(finding.getPathFinding()).toBe(PATH);
      expect(finding.getErrorFinding()).toBe(ERROR);
      expect(finding.getSecretCategory()).toBe(CATEGORY);
      expect(finding.getRuleId()).toBe(RULE_ID);
      expect(finding.getRemediation()).toBe(REMEDIATION);
    });

    it('should trim secret category and ruleId', () => {
      const finding = SecretFinding.create(
        PATH, 
        ERROR, 
        '  jwt-token  ', 
        '  generic-api-key  ',
        REMEDIATION
      );
      expect(finding.getSecretCategory()).toBe('jwt-token');
      expect(finding.getRuleId()).toBe('generic-api-key');
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = SecretFinding.create(PATH, ERROR, 'jwt-token', RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different category', () => {
      const a = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = SecretFinding.create(PATH, ERROR, 'aws-access-key', RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different ruleId', () => {
      const a = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = SecretFinding.create(PATH, ERROR, CATEGORY, 'other-rule-id', REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different path', () => {
      const otherPath = PathFinding.create('src/other.ts');

      const a = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = SecretFinding.create(otherPath, ERROR, CATEGORY, RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different error', () => {
      const otherError = ErrorFinding.create(20, DESCRIPTION, SEVERITY);

      const a = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = SecretFinding.create(PATH, otherError, CATEGORY, RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different remediation', () => {
      const otherRemediation = DescriptionFinding.create('Rotate the keys immediately');

      const a = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, otherRemediation);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw error if equals is called with invalid argument', () => {
      const finding = SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);

      expect(() => finding.equals(null as unknown as SecretFinding)).toThrow('Invalid argument');
      expect(() => finding.equals({} as unknown as SecretFinding)).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if secret category is not a string or is empty', () => {
      expect(() => SecretFinding.create(PATH, ERROR, null as unknown as string, RULE_ID, REMEDIATION)).toThrow(
        'Secret category must be a non-empty string',
      );

      expect(() => SecretFinding.create(PATH, ERROR, '   ', RULE_ID, REMEDIATION)).toThrow(
        'Secret category must be a non-empty string',
      );
    });

    it('should throw if ruleId is not a string or is empty', () => {
      expect(() => SecretFinding.create(PATH, ERROR, CATEGORY, null as unknown as string, REMEDIATION)).toThrow(
        'Rule id must be a non-empty string',
      );

      expect(() => SecretFinding.create(PATH, ERROR, CATEGORY, '   ', REMEDIATION)).toThrow(
        'Rule id must be a non-empty string',
      );
    });

    it('should throw if PathFinding is invalid', () => {
      expect(() => SecretFinding.create(null as unknown as PathFinding, ERROR, CATEGORY, RULE_ID, REMEDIATION)).toThrow('Invalid PathFinding');
    });

    it('should throw if ErrorFinding is invalid', () => {
      expect(() => SecretFinding.create(PATH, null as unknown as ErrorFinding, CATEGORY, RULE_ID, REMEDIATION)).toThrow('Invalid ErrorFinding');
    });

    it('should throw if remediation is invalid', () => {
      expect(() => SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, null)).toThrow('Invalid DescriptionFinding');
      expect(() => SecretFinding.create(PATH, ERROR, CATEGORY, RULE_ID, {})).toThrow('Invalid DescriptionFinding');
    });
  });
});