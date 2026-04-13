import { ConfigDependency } from '../../../../src/analysis/domain/value-objects/config-dependency.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';

describe('ConfigDependency (Value Object)', () => {
  const VALID_NAME = 'typescript';
  const VALID_VERSION = '^5.0.0';
  const VALID_PATH = PathFinding.create('package.json');

  describe('Success cases', () => {
    it('should create a valid ConfigDependency instance with a version', () => {
      const dependency = ConfigDependency.create(VALID_NAME, VALID_VERSION, VALID_PATH);

      expect(dependency).toBeDefined();
      expect(dependency).toBeInstanceOf(ConfigDependency);
    });

    it('should create a valid ConfigDependency instance with a null version', () => {
      const dependency = ConfigDependency.create(VALID_NAME, null, VALID_PATH);

      expect(dependency).toBeDefined();
      expect(dependency.getVersionPinned()).toBeNull();
    });

    it('should return true for equal objects (with version)', () => {
      const d1 = ConfigDependency.create(VALID_NAME, VALID_VERSION, VALID_PATH);
      const d2 = ConfigDependency.create(
        'typescript',
        '^5.0.0',
        PathFinding.create('package.json'),
      );

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return true for equal objects (with null version)', () => {
      const d1 = ConfigDependency.create(VALID_NAME, null, VALID_PATH);
      const d2 = ConfigDependency.create('typescript', null, PathFinding.create('package.json'));

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const dependency = ConfigDependency.create(VALID_NAME, VALID_VERSION, VALID_PATH);

      expect(dependency.getName()).toBe(VALID_NAME);
      expect(dependency.getVersionPinned()).toBe(VALID_VERSION);
      expect(dependency.getPathFinding()).toBe(VALID_PATH);
    });

    it('should trim string fields when creating an instance', () => {
      const dependency = ConfigDependency.create('  typescript  ', '  ^5.0.0  ', VALID_PATH);

      expect(dependency.getName()).toBe('typescript');
      expect(dependency.getVersionPinned()).toBe('^5.0.0');
    });
  });

  describe('Failure cases', () => {
    it('should throw if name is empty or only whitespace', () => {
      expect(() => ConfigDependency.create('', VALID_VERSION, VALID_PATH)).toThrow(
        'Name must be a non-empty string',
      );

      expect(() => ConfigDependency.create('   ', VALID_VERSION, VALID_PATH)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should throw if name is not a string', () => {
      expect(() => ConfigDependency.create(123, VALID_VERSION, VALID_PATH)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should throw if path is invalid', () => {
      expect(() =>
        ConfigDependency.create(VALID_NAME, VALID_VERSION, {} as unknown as PathFinding),
      ).toThrow('Invalid PathFinding');
    });

    it('should return false for different objects', () => {
      const base = ConfigDependency.create(VALID_NAME, VALID_VERSION, VALID_PATH);

      const differentName = ConfigDependency.create('jest', VALID_VERSION, VALID_PATH);
      const differentVersion = ConfigDependency.create(VALID_NAME, '^29.0.0', VALID_PATH);
      const nullVersion = ConfigDependency.create(VALID_NAME, null, VALID_PATH);
      const differentPath = ConfigDependency.create(
        VALID_NAME,
        VALID_VERSION,
        PathFinding.create('other/package.json'),
      );

      expect(base.equals(differentName)).toBe(false);
      expect(base.equals(differentVersion)).toBe(false);
      expect(base.equals(nullVersion)).toBe(false);
      expect(base.equals(differentPath)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const dependency = ConfigDependency.create(VALID_NAME, VALID_VERSION, VALID_PATH);

      expect(() => dependency.equals(null)).toThrow('Invalid argument');
      expect(() => dependency.equals({})).toThrow('Invalid argument');
    });
  });
});
