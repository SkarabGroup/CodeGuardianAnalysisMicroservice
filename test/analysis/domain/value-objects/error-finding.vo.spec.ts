import { ErrorFinding } from '../../../../src/analysis/domain/value-objects/error-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';

describe('ErrorFinding (Value Object)', () => {
  const VALID_LINE = 7;
  const VALID_DESCRIPTION = DescriptionFinding.create('API endpoint is missing authentication');
  const VALID_SEVERITY = SeverityFinding.create('HIGH');

  describe('Success cases', () => {
    it('should create a valid ErrorFinding instance', () => {
      const error = ErrorFinding.create(VALID_LINE, VALID_DESCRIPTION, VALID_SEVERITY);

      expect(error).toBeDefined();
    });

    it('should return true for equal ErrorFindings', () => {
      const e1 = ErrorFinding.create(VALID_LINE, VALID_DESCRIPTION, VALID_SEVERITY);
      const e2 = ErrorFinding.create(
        7,
        DescriptionFinding.create('API endpoint is missing authentication'),
        SeverityFinding.create('HIGH'),
      );

      expect(e1.equals(e2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const ef = ErrorFinding.create(VALID_LINE, VALID_DESCRIPTION, VALID_SEVERITY);

      expect(ef.getErrorLine()).toBe(VALID_LINE);
      expect(ef.getDescriptionFinding()).toBe(VALID_DESCRIPTION);
      expect(ef.getSeverityFinding()).toBe(VALID_SEVERITY);
    });
  });

  describe('Failure cases', () => {
    it('should throw if line is not a number', () => {
      expect(() =>
        ErrorFinding.create('10' as unknown as number, VALID_DESCRIPTION, VALID_SEVERITY),
      ).toThrow('Line must be a number');
    });

    it('should throw if line is not an integer', () => {
      expect(() => ErrorFinding.create(10.5, VALID_DESCRIPTION, VALID_SEVERITY)).toThrow(
        'Line must be an integer',
      );
    });

    it('should throw if line is <= 0', () => {
      expect(() => ErrorFinding.create(0, VALID_DESCRIPTION, VALID_SEVERITY)).toThrow(
        'Line must be a positive number',
      );

      expect(() => ErrorFinding.create(-1, VALID_DESCRIPTION, VALID_SEVERITY)).toThrow(
        'Line must be a positive number',
      );
    });

    it('should throw if description is invalid', () => {
      expect(() =>
        ErrorFinding.create(VALID_LINE, {} as unknown as DescriptionFinding, VALID_SEVERITY),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should throw if severity is invalid', () => {
      expect(() =>
        ErrorFinding.create(VALID_LINE, VALID_DESCRIPTION, {} as unknown as SeverityFinding),
      ).toThrow('Invalid SeverityFinding');
    });

    it('should return false for different ErrorFindings', () => {
      const e1 = ErrorFinding.create(VALID_LINE, VALID_DESCRIPTION, VALID_SEVERITY);
      const e2 = ErrorFinding.create(
        20,
        DescriptionFinding.create('Different description'),
        SeverityFinding.create('LOW'),
      );

      expect(e1.equals(e2)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const e = ErrorFinding.create(VALID_LINE, VALID_DESCRIPTION, VALID_SEVERITY);

      expect(() => e.equals(null)).toThrow('Invalid argument');
      expect(() => e.equals({})).toThrow('Invalid argument');
    });
  });
});
