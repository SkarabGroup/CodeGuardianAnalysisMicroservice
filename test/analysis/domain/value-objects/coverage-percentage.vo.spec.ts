import { CoveragePercentage } from '../../../../src/analysis/domain/value-objects/code/coverage-percentage.vo';

describe('CoveragePercentage (Value Object)', () => {
  const VALID_PERCENTAGES = [0, 0.01, 0.5, 0.99, 1];
  const INVALID_PERCENTAGES = [-0.1, 1.1, NaN, Infinity, -Infinity];

  describe('Success cases', () => {
    it('should create a CoveragePercentage instance for valid numbers', () => {
      VALID_PERCENTAGES.forEach((value) => {
        const cp = CoveragePercentage.create(value);

        expect(cp).toBeDefined();
        expect(cp.value).toBe(value);
      });
    });
  });

  describe('Failure cases', () => {
    it('should throw an error for numbers outside 0-1', () => {
      INVALID_PERCENTAGES.forEach((value) => {
        expect(() => CoveragePercentage.create(value)).toThrow(
          'Coverage percentage must be a number between 0 and 1',
        );
      });
    });

    it('should throw an error if input is not a number', () => {
      const badValues = ['string', null, undefined, {}, []];
      badValues.forEach((val) => {
        expect(() => CoveragePercentage.create(val)).toThrow(
          'Coverage percentage must be a number',
        );
      });
    });
  });

  describe('Equality check', () => {
    it('should return true for equal percentages', () => {
      const a = CoveragePercentage.create(0.5);
      const b = CoveragePercentage.create(0.5);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different percentages', () => {
      const a = CoveragePercentage.create(0.5);
      const b = CoveragePercentage.create(0.6);
      expect(a.equals(b)).toBe(false);
    });

    it('should throw error when equals is called with non-CoveragePercentage', () => {
      const a = CoveragePercentage.create(0.5);
      expect(() => a.equals(null)).toThrow('Invalid argument');
      expect(() => a.equals({})).toThrow('Invalid argument');
    });
  });
});
