import { UndocumentedDependency } from '../../../../src/analysis/domain/value-objects/undocumented-dependency.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';

describe('UndocumentedDependency (Value Object)', () => {
  const VALID_NAME = 'axios';
  const VALID_PATH = PathFinding.create('src/services/api.ts');

  describe('Success cases', () => {
    it('should create a valid UndocumentedDependency instance', () => {
      const dependency = UndocumentedDependency.create(VALID_NAME, VALID_PATH);

      expect(dependency).toBeDefined();
      expect(dependency).toBeInstanceOf(UndocumentedDependency);
    });

    it('should return true for equal objects', () => {
      const d1 = UndocumentedDependency.create(VALID_NAME, VALID_PATH);
      const d2 = UndocumentedDependency.create('axios', PathFinding.create('src/services/api.ts'));

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const dependency = UndocumentedDependency.create(VALID_NAME, VALID_PATH);

      expect(dependency.getName()).toBe(VALID_NAME);
      expect(dependency.getPathFinding()).toBe(VALID_PATH);
    });

    it('should trim the name string when creating an instance', () => {
      const dependency = UndocumentedDependency.create('  axios  ', VALID_PATH);

      expect(dependency.getName()).toBe('axios');
    });
  });

  describe('Failure cases', () => {
    it('should throw if name is empty or only whitespace', () => {
      expect(() => UndocumentedDependency.create('', VALID_PATH)).toThrow(
        'Name must be a non-empty string',
      );

      expect(() => UndocumentedDependency.create('   ', VALID_PATH)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should throw if name is not a string', () => {
      expect(() => UndocumentedDependency.create(123, VALID_PATH)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should throw if path is invalid', () => {
      expect(() => UndocumentedDependency.create(VALID_NAME, {} as unknown as PathFinding)).toThrow(
        'Invalid PathFinding',
      );
    });

    it('should return false for different objects', () => {
      const base = UndocumentedDependency.create(VALID_NAME, VALID_PATH);

      const differentName = UndocumentedDependency.create('node-fetch', VALID_PATH);

      const differentPath = UndocumentedDependency.create(
        VALID_NAME,
        PathFinding.create('src/utils/http.ts'),
      );

      expect(base.equals(differentName)).toBe(false);
      expect(base.equals(differentPath)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const dependency = UndocumentedDependency.create(VALID_NAME, VALID_PATH);

      expect(() => dependency.equals(null)).toThrow('Invalid argument');
      expect(() => dependency.equals({})).toThrow('Invalid argument');
    });
  });
});
