import { PositionFinding } from '../../../../src/analysis/domain/value-objects/position-finding.vo';

describe('PositionFinding (Value Object)', () => {
  describe('Success cases', () => {
    it('should create a valid PositionFinding', () => {
      const p = PositionFinding.create(1, 5, 0);
      expect(p).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const p = PositionFinding.create(3, 7, 10);

      expect(p.getLineStart()).toBe(3);
      expect(p.getLineEnd()).toBe(7);
      expect(p.getColumn()).toBe(10);
    });

    it('should allow lineStart equal to lineEnd', () => {
      const p = PositionFinding.create(5, 5, 0);
      expect(p.getLineStart()).toBe(5);
      expect(p.getLineEnd()).toBe(5);
    });

    it('should allow column of 0', () => {
      const p = PositionFinding.create(1, 1, 0);
      expect(p.getColumn()).toBe(0);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = PositionFinding.create(1, 5, 3);
      const b = PositionFinding.create(1, 5, 3);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different lineStart', () => {
      const a = PositionFinding.create(1, 5, 3);
      const b = PositionFinding.create(2, 5, 3);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different lineEnd', () => {
      const a = PositionFinding.create(1, 5, 3);
      const b = PositionFinding.create(1, 6, 3);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different column', () => {
      const a = PositionFinding.create(1, 5, 3);
      const b = PositionFinding.create(1, 5, 9);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw if equals is called with invalid argument', () => {
      const p = PositionFinding.create(1, 5, 3);

      expect(() => p.equals(null as any)).toThrow('Invalid argument');
      expect(() => p.equals({} as any)).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if lineStart is not a number', () => {
      expect(() => PositionFinding.create('1' as any, 5, 0)).toThrow('lineStart must be a number');
    });

    it('should throw if lineEnd is not a number', () => {
      expect(() => PositionFinding.create(1, '5' as any, 0)).toThrow('lineEnd must be a number');
    });

    it('should throw if column is not a number', () => {
      expect(() => PositionFinding.create(1, 5, '0' as any)).toThrow('column must be a number');
    });

    it('should throw if lineStart is 0', () => {
      expect(() => PositionFinding.create(0, 5, 0)).toThrow('lineStart must be a positive integer');
    });

    it('should throw if lineStart is negative', () => {
      expect(() => PositionFinding.create(-1, 5, 0)).toThrow('lineStart must be a positive integer');
    });

    it('should throw if lineStart is not an integer', () => {
      expect(() => PositionFinding.create(1.5, 5, 0)).toThrow('lineStart must be a positive integer');
    });

    it('should throw if lineEnd is 0', () => {
      expect(() => PositionFinding.create(1, 0, 0)).toThrow('lineEnd must be a positive integer');
    });

    it('should throw if lineEnd is negative', () => {
      expect(() => PositionFinding.create(1, -1, 0)).toThrow('lineEnd must be a positive integer');
    });

    it('should throw if lineEnd is not an integer', () => {
      expect(() => PositionFinding.create(1, 5.5, 0)).toThrow('lineEnd must be a positive integer');
    });

    it('should throw if lineStart is greater than lineEnd', () => {
      expect(() => PositionFinding.create(10, 5, 0)).toThrow(
        'lineStart must be less than or equal to lineEnd',
      );
    });

    it('should throw if column is negative', () => {
      expect(() => PositionFinding.create(1, 5, -1)).toThrow('column must be a non-negative integer');
    });

    it('should throw if column is not an integer', () => {
      expect(() => PositionFinding.create(1, 5, 1.5)).toThrow('column must be a non-negative integer');
    });
  });
});