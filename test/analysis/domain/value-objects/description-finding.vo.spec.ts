import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('DescriptionFinding (Value Object)', () => {
  const VALID_DESCRIPTION = 'Missing API description';

  describe('Success cases', () => {
    it('should create a valid DescriptionFinding instance', () => {
      const description = DescriptionFinding.create(VALID_DESCRIPTION);

      expect(description).toBeDefined();
      expect(description.value).toBe(VALID_DESCRIPTION);
    });

    it('should return true for equal descriptions', () => {
      const d1 = DescriptionFinding.create('Missing API description');
      const d2 = DescriptionFinding.create('Missing API description');

      expect(d1.equals(d2)).toBe(true);
    });
  });

  describe('Failure cases', () => {
    it('should throw an error if the string is empty', () => {
      expect(() => DescriptionFinding.create('')).toThrow('Description cannot be empty');
    });

    it('should throw an error for non-string input', () => {
      expect(() => DescriptionFinding.create(123)).toThrow('Description must be a string');
    });

    it('should return false for different descriptions', () => {
      const d1 = DescriptionFinding.create('Missing API description');
      const d2 = DescriptionFinding.create('Another description');

      expect(d1.equals(d2)).toBe(false);
    });

    it('should throw an error when comparing with invalid object', () => {
      const d = DescriptionFinding.create('Missing API description');

      expect(() => d.equals(null)).toThrow('Invalid argument');
      expect(() => d.equals({})).toThrow('Invalid argument');
    });
  });
});
