import { VersionMismatchDependency } from '../../../../src/analysis/domain/value-objects/version-mismatch-dependency.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';

describe('VersionMismatchDependency (Value Object)', () => {
  const VALID_NAME = 'express';
  const VALID_README_VERSION = '^4.18.0';
  const VALID_CONFIG_VERSION = '^4.18.2';
  const VALID_PATH = PathFinding.create('package.json');

  describe('Success cases', () => {
    it('should create a valid VersionMismatchDependency instance', () => {
      const dependency = VersionMismatchDependency.create(
        VALID_NAME,
        VALID_README_VERSION,
        VALID_CONFIG_VERSION,
        VALID_PATH,
      );

      expect(dependency).toBeDefined();
      expect(dependency).toBeInstanceOf(VersionMismatchDependency);
    });

    it('should return true for equal objects', () => {
      const d1 = VersionMismatchDependency.create(
        VALID_NAME,
        VALID_README_VERSION,
        VALID_CONFIG_VERSION,
        VALID_PATH,
      );
      const d2 = VersionMismatchDependency.create(
        'express',
        '^4.18.0',
        '^4.18.2',
        PathFinding.create('package.json'),
      );

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const dependency = VersionMismatchDependency.create(
        VALID_NAME,
        VALID_README_VERSION,
        VALID_CONFIG_VERSION,
        VALID_PATH,
      );

      expect(dependency.getName()).toBe(VALID_NAME);
      expect(dependency.getReadmeVersion()).toBe(VALID_README_VERSION);
      expect(dependency.getConfigVersion()).toBe(VALID_CONFIG_VERSION);
      expect(dependency.getPathFinding()).toBe(VALID_PATH);
    });

    it('should trim string fields when creating an instance', () => {
      const dependency = VersionMismatchDependency.create(
        '  express  ',
        '  ^4.18.0  ',
        '  ^4.18.2  ',
        VALID_PATH,
      );

      expect(dependency.getName()).toBe('express');
      expect(dependency.getReadmeVersion()).toBe('^4.18.0');
      expect(dependency.getConfigVersion()).toBe('^4.18.2');
    });
  });

  describe('Failure cases', () => {
    it('should throw if name is empty or only whitespace', () => {
      expect(() =>
        VersionMismatchDependency.create(
          '',
          VALID_README_VERSION,
          VALID_CONFIG_VERSION,
          VALID_PATH,
        ),
      ).toThrow('Name must be a non-empty string');

      expect(() =>
        VersionMismatchDependency.create(
          '   ',
          VALID_README_VERSION,
          VALID_CONFIG_VERSION,
          VALID_PATH,
        ),
      ).toThrow('Name must be a non-empty string');
    });

    it('should throw if readmeVersion is empty', () => {
      expect(() =>
        VersionMismatchDependency.create(VALID_NAME, '', VALID_CONFIG_VERSION, VALID_PATH),
      ).toThrow('readmeVersion must be a non-empty string');
    });

    it('should throw if configVersion is empty', () => {
      expect(() =>
        VersionMismatchDependency.create(VALID_NAME, VALID_README_VERSION, '', VALID_PATH),
      ).toThrow('configVersion must be a non-empty string');
    });

    it('should throw if path is invalid', () => {
      expect(() =>
        VersionMismatchDependency.create(
          VALID_NAME,
          VALID_README_VERSION,
          VALID_CONFIG_VERSION,
          {} as unknown as PathFinding,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should return false for different objects', () => {
      const base = VersionMismatchDependency.create(
        VALID_NAME,
        VALID_README_VERSION,
        VALID_CONFIG_VERSION,
        VALID_PATH,
      );

      const differentName = VersionMismatchDependency.create(
        'different-package',
        VALID_README_VERSION,
        VALID_CONFIG_VERSION,
        VALID_PATH,
      );

      const differentReadme = VersionMismatchDependency.create(
        VALID_NAME,
        '1.0.0',
        VALID_CONFIG_VERSION,
        VALID_PATH,
      );

      const differentConfig = VersionMismatchDependency.create(
        VALID_NAME,
        VALID_README_VERSION,
        '2.0.0',
        VALID_PATH,
      );

      const differentPath = VersionMismatchDependency.create(
        VALID_NAME,
        VALID_README_VERSION,
        VALID_CONFIG_VERSION,
        PathFinding.create('other/package.json'),
      );

      expect(base.equals(differentName)).toBe(false);
      expect(base.equals(differentReadme)).toBe(false);
      expect(base.equals(differentConfig)).toBe(false);
      expect(base.equals(differentPath)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const dependency = VersionMismatchDependency.create(
        VALID_NAME,
        VALID_README_VERSION,
        VALID_CONFIG_VERSION,
        VALID_PATH,
      );

      expect(() => dependency.equals(null)).toThrow('Invalid argument');
      expect(() => dependency.equals({})).toThrow('Invalid argument');
    });
  });
});
