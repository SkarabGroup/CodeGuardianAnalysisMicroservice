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

    it('should resolve aliases correctly to their corresponding SeverityLevel', () => {
      expect(SeverityFinding.create('INFO').value).toBe(SeverityLevel.LOW);
      expect(SeverityFinding.create('HINT').value).toBe(SeverityLevel.LOW);
      expect(SeverityFinding.create('WARNING').value).toBe(SeverityLevel.MEDIUM);
      expect(SeverityFinding.create('ERROR').value).toBe(SeverityLevel.HIGH);
      expect(SeverityFinding.create('FATAL').value).toBe(SeverityLevel.CRITICAL);
    });

    it('should fallback to MEDIUM for unknown severity strings', () => {
      const severity = SeverityFinding.create('UNKNOWN_WEIRD_VALUE');

      expect(severity.value).toBe(SeverityLevel.MEDIUM);
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
      const invalidInput: unknown = 123;
      expect(() => SeverityFinding.create(invalidInput as string)).toThrow(
        'Severity must be a string',
      );
    });

    it('should return false for different severities', () => {
      const s1 = SeverityFinding.create('LOW');
      const s2 = SeverityFinding.create('CRITICAL');

      expect(s1.equals(s2)).toBe(false);
    });

    it('should throw an error when comparing with invalid object', () => {
      const s = SeverityFinding.create('LOW');

      const invalidNull: unknown = null;
      const invalidObject: unknown = {};

      expect(() => s.equals(invalidNull as SeverityFinding)).toThrow('Invalid argument');
      expect(() => s.equals(invalidObject as SeverityFinding)).toThrow('Invalid argument');
    });

    it('should throw an error for invalid severity level if constructor is bypassed (line 41 coverage)', () => {
      const BypassedSeverityFinding = SeverityFinding as unknown as new (
        value: string,
      ) => SeverityFinding;

      expect(() => new BypassedSeverityFinding('UNSUPPORTED_SEVERITY')).toThrow(
        'Invalid severity level: UNSUPPORTED_SEVERITY',
      );
    });
  });
});
