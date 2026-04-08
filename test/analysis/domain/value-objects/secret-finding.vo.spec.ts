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

  describe('Success cases', () => {
    it('should create a valid SecretFinding', () => {
      const finding = SecretFinding.create(PATH, ERROR, CATEGORY);
      expect(finding).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const finding = SecretFinding.create(PATH, ERROR, CATEGORY);

      expect(finding.getPathFinding()).toBe(PATH);
      expect(finding.getErrorFinding()).toBe(ERROR);
      expect(finding.getSecretCategory()).toBe(CATEGORY);
    });

    it('should trim secret category', () => {
      const finding = SecretFinding.create(PATH, ERROR, '  jwt-token  ');
      expect(finding.getSecretCategory()).toBe('jwt-token');
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = SecretFinding.create(PATH, ERROR, CATEGORY);
      const b = SecretFinding.create(PATH, ERROR, 'jwt-token');

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different category', () => {
      const a = SecretFinding.create(PATH, ERROR, CATEGORY);
      const b = SecretFinding.create(PATH, ERROR, 'aws-access-key');

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different path', () => {
      const otherPath = PathFinding.create('src/other.ts');

      const a = SecretFinding.create(PATH, ERROR, CATEGORY);
      const b = SecretFinding.create(otherPath, ERROR, CATEGORY);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different error', () => {
      const otherError = ErrorFinding.create(20, DESCRIPTION, SEVERITY);

      const a = SecretFinding.create(PATH, ERROR, CATEGORY);
      const b = SecretFinding.create(PATH, otherError, CATEGORY);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw error if equals is called with invalid argument', () => {
      const finding = SecretFinding.create(PATH, ERROR, CATEGORY);

      expect(() => finding.equals(null)).toThrow('Invalid argument');

      expect(() => finding.equals({})).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if secret category is not a string', () => {
      expect(() => SecretFinding.create(PATH, ERROR, null)).toThrow(
        'Secret category must be a string',
      );
    });

    it('should throw if secret category is empty', () => {
      expect(() => SecretFinding.create(PATH, ERROR, '   ')).toThrow(
        'Secret category cannot be empty',
      );
    });

    it('should throw if PathFinding is invalid', () => {
      expect(() => SecretFinding.create(null, ERROR, CATEGORY)).toThrow('Invalid PathFinding');
    });

    it('should throw if ErrorFinding is invalid', () => {
      expect(() => SecretFinding.create(PATH, null, CATEGORY)).toThrow('Invalid ErrorFinding');
    });
  });
});
