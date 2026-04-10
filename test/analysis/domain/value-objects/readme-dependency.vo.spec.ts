import { ReadmeDependency } from '../../../../src/analysis/domain/value-objects/readme-dependency.vo';

describe('ReadmeDependency (Value Object)', () => {
  const VALID_NAME = 'react';
  const VALID_VERSION = '^18.2.0';

  describe('Success cases', () => {
    it('should create a valid ReadmeDependency instance with a version', () => {
      const dependency = ReadmeDependency.create(VALID_NAME, VALID_VERSION);

      expect(dependency).toBeDefined();
      expect(dependency).toBeInstanceOf(ReadmeDependency);
    });

    it('should create a valid ReadmeDependency instance with a null version', () => {
      const dependency = ReadmeDependency.create(VALID_NAME, null);

      expect(dependency).toBeDefined();
      expect(dependency.getVersionClaimed()).toBeNull();
    });

    it('should return true for equal objects (with version)', () => {
      const d1 = ReadmeDependency.create(VALID_NAME, VALID_VERSION);
      const d2 = ReadmeDependency.create('react', '^18.2.0');

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return true for equal objects (with null version)', () => {
      const d1 = ReadmeDependency.create(VALID_NAME, null);
      const d2 = ReadmeDependency.create('react', null);

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const dependency = ReadmeDependency.create(VALID_NAME, VALID_VERSION);

      expect(dependency.getName()).toBe(VALID_NAME);
      expect(dependency.getVersionClaimed()).toBe(VALID_VERSION);
    });

    it('should trim string fields when creating an instance', () => {
      const dependency = ReadmeDependency.create('  react  ', '  ^18.2.0  ');

      expect(dependency.getName()).toBe('react');
      expect(dependency.getVersionClaimed()).toBe('^18.2.0');
    });
  });

  describe('Failure cases', () => {
    it('should throw if name is empty or only whitespace', () => {
      expect(() => ReadmeDependency.create('', VALID_VERSION)).toThrow(
        'Name must be a non-empty string',
      );

      expect(() => ReadmeDependency.create('   ', VALID_VERSION)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should throw if name is not a string', () => {
      expect(() => ReadmeDependency.create(123, VALID_VERSION)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should return false for different objects', () => {
      const base = ReadmeDependency.create(VALID_NAME, VALID_VERSION);

      const differentName = ReadmeDependency.create('vue', VALID_VERSION);
      const differentVersion = ReadmeDependency.create(VALID_NAME, '^3.0.0');
      const nullVersion = ReadmeDependency.create(VALID_NAME, null);

      expect(base.equals(differentName)).toBe(false);
      expect(base.equals(differentVersion)).toBe(false);
      expect(base.equals(nullVersion)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const dependency = ReadmeDependency.create(VALID_NAME, VALID_VERSION);

      expect(() => dependency.equals(null)).toThrow('Invalid argument');
      expect(() => dependency.equals({})).toThrow('Invalid argument');
    });
  });
});
