import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';

describe('PathFinding (Value Object)', () => {
  const VALID_PATH = 'src/app/file.ts';
  const INVALID_ABSOLUTE = '/src/app/file.ts';
  const INVALID_BACKSLASH = 'src\\app\\file.ts';
  const INVALID_TRAVERSAL = '../app/file.ts';

  describe('Success cases', () => {
    it('should create a valid PathFinding instance', () => {
      const path = PathFinding.create(VALID_PATH);

      expect(path).toBeDefined();
      expect(path.value).toBe(VALID_PATH);
    });

    it('should return true for equal paths', () => {
      const p1 = PathFinding.create('src/app/file.ts');
      const p2 = PathFinding.create('src/app/file.ts');

      expect(p1.equals(p2)).toBe(true);
    });
  });

  describe('Failure cases', () => {
    it('should throw an error if the string is empty', () => {
      expect(() => PathFinding.create('')).toThrow('Path cannot be empty');
    });

    it('should throw an error if the string is absolute', () => {
      expect(() => PathFinding.create(INVALID_ABSOLUTE)).toThrow('Path must be relative');
    });

    it('should throw an error if the string contains backslashes', () => {
      expect(() => PathFinding.create(INVALID_BACKSLASH)).toThrow(
        'Path must not contain "\\". Use "/" separators',
      );
    });

    it('should throw an error if the string contains ".."', () => {
      expect(() => PathFinding.create(INVALID_TRAVERSAL)).toThrow('Path cannot contain ".."');
    });

    it('should throw an error for non-string input', () => {
      expect(() => PathFinding.create(123)).toThrow('Path must be a string');
    });

    it('should return false for different paths', () => {
      const p1 = PathFinding.create('src/app/file.ts');
      const p2 = PathFinding.create('src/app/other.ts');

      expect(p1.equals(p2)).toBe(false);
    });

    it('should throw an error when comparing with invalid object', () => {
      const p = PathFinding.create('src/app/file.ts');

      expect(() => p.equals(null)).toThrow('Invalid argument');
      expect(() => p.equals({})).toThrow('Invalid argument');
    });
  });
});
