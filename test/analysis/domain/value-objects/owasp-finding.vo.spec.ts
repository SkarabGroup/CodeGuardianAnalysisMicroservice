import { OWASPFinding } from '../../../../src/analysis/domain/value-objects/owasp-finding.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { ErrorFinding } from '../../../../src/analysis/domain/value-objects/error-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';

describe('OWASPFinding (Value Object)', () => {
  const PATH = PathFinding.create('src/file.ts');
  const DESCRIPTION = DescriptionFinding.create('SQL Injection vulnerability');
  const SEVERITY = SeverityFinding.create('HIGH');
  const ERROR = ErrorFinding.create(10, DESCRIPTION, SEVERITY);

  const CATEGORY = 'A03:2021-Injection';

  describe('Success cases', () => {
    it('should create a valid OWASPFinding', () => {
      const finding = OWASPFinding.create(PATH, ERROR, CATEGORY);
      expect(finding).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const finding = OWASPFinding.create(PATH, ERROR, CATEGORY);

      expect(finding.getPathFinding()).toBe(PATH);
      expect(finding.getErrorFinding()).toBe(ERROR);
      expect(finding.getOWASPCategory()).toBe(CATEGORY);
    });

    it('should trim OWASP category', () => {
      const finding = OWASPFinding.create(PATH, ERROR, '  A03:2021-Injection  ');
      expect(finding.getOWASPCategory()).toBe('A03:2021-Injection');
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = OWASPFinding.create(PATH, ERROR, CATEGORY);
      const b = OWASPFinding.create(PATH, ERROR, CATEGORY);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different category', () => {
      const a = OWASPFinding.create(PATH, ERROR, CATEGORY);
      const b = OWASPFinding.create(PATH, ERROR, 'A02:Broken Auth');

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different path', () => {
      const otherPath = PathFinding.create('src/other.ts');

      const a = OWASPFinding.create(PATH, ERROR, CATEGORY);
      const b = OWASPFinding.create(otherPath, ERROR, CATEGORY);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different error', () => {
      const otherError = ErrorFinding.create(20, DESCRIPTION, SEVERITY);

      const a = OWASPFinding.create(PATH, ERROR, CATEGORY);
      const b = OWASPFinding.create(PATH, otherError, CATEGORY);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw error if equals is called with invalid argument', () => {
      const finding = OWASPFinding.create(PATH, ERROR, CATEGORY);

      expect(() => finding.equals(null)).toThrow('Invalid argument');

      expect(() => finding.equals({})).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if OWASP category is not a string', () => {
      expect(() => OWASPFinding.create(PATH, ERROR, null)).toThrow(
        'OWASP category must be a string',
      );
    });

    it('should throw if OWASP category is empty', () => {
      expect(() => OWASPFinding.create(PATH, ERROR, '   ')).toThrow(
        'OWASP category cannot be empty',
      );
    });

    it('should throw if PathFinding is invalid', () => {
      expect(() => OWASPFinding.create(null, ERROR, CATEGORY)).toThrow('Invalid PathFinding');
    });

    it('should throw if ErrorFinding is invalid', () => {
      expect(() => OWASPFinding.create(PATH, null, CATEGORY)).toThrow('Invalid ErrorFinding');
    });
  });
});
