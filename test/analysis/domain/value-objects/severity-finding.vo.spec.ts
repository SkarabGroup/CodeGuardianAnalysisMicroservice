import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';

describe('SeverityFinding (Value Object)', () => {
  const VALID_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  describe('Success cases', () => {
    it('should create a SeverityFinding instance for valid severities', () => {
      VALID_SEVERITY.forEach((value) => {
        const severity = SeverityFinding.create(value);

        expect(severity).toBeDefined();
        expect(severity.value).toBe(value as SeverityLevel);
      });
    });

    it('should normalize lowercase input to uppercase', () => {
      const severity = SeverityFinding.create('low');

      expect(severity.value).toBe(SeverityLevel.LOW);
    });

    it('should return true for equal severities', () => {
      const s1 = SeverityFinding.create('high');
      const s2 = SeverityFinding.create('HIGH');

      expect(s1.equals(s2)).toBe(true);
    });
  });

  describe('Failure cases', () => {
    it('should throw an error if the string is empty', () => {
      expect(() => SeverityFinding.create('')).toThrow('Severity cannot be empty');
      expect(() => SeverityFinding.create('   ')).toThrow('Severity cannot be empty');
    });

    it('should throw an error for non-string input', () => {
      expect(() => SeverityFinding.create(123)).toThrow('Severity must be a string');
    });

    it('should return false for different severities', () => {
      const s1 = SeverityFinding.create('LOW');
      const s2 = SeverityFinding.create('CRITICAL');

      expect(s1.equals(s2)).toBe(false);
    });

    it('should throw an error when comparing with invalid object', () => {
      const s = SeverityFinding.create('LOW');

      expect(() => s.equals(null)).toThrow('Invalid argument');
      expect(() => s.equals({})).toThrow('Invalid argument');
    });
  });
});
