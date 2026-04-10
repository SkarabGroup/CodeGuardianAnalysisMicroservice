import { MissingInConfigDependency } from '../../../../src/analysis/domain/value-objects/missing-in-config-dependency.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';

describe('MissingInConfigDependency (Value Object)', () => {
  const VALID_NAME = 'lodash';
  const VALID_PATH = PathFinding.create('README.md');
  const VALID_SEVERITY = SeverityFinding.create('HIGH');

  describe('Success cases', () => {
    it('should create a valid MissingInConfigDependency instance', () => {
      const dependency = MissingInConfigDependency.create(VALID_NAME, VALID_PATH, VALID_SEVERITY);

      expect(dependency).toBeDefined();
      expect(dependency).toBeInstanceOf(MissingInConfigDependency);
    });

    it('should return true for equal objects', () => {
      const d1 = MissingInConfigDependency.create(VALID_NAME, VALID_PATH, VALID_SEVERITY);
      const d2 = MissingInConfigDependency.create(
        'lodash',
        PathFinding.create('README.md'),
        SeverityFinding.create('HIGH'),
      );

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const dependency = MissingInConfigDependency.create(VALID_NAME, VALID_PATH, VALID_SEVERITY);

      expect(dependency.getName()).toBe(VALID_NAME);
      expect(dependency.getPathFinding()).toBe(VALID_PATH);
      expect(dependency.getSeverityFinding()).toBe(VALID_SEVERITY);
    });

    it('should trim string fields when creating an instance', () => {
      const dependency = MissingInConfigDependency.create('  lodash  ', VALID_PATH, VALID_SEVERITY);

      expect(dependency.getName()).toBe('lodash');
    });
  });

  describe('Failure cases', () => {
    it('should throw if name is empty or only whitespace', () => {
      expect(() => MissingInConfigDependency.create('', VALID_PATH, VALID_SEVERITY)).toThrow(
        'Name must be a non-empty string',
      );

      expect(() => MissingInConfigDependency.create('   ', VALID_PATH, VALID_SEVERITY)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should throw if name is not a string', () => {
      expect(() => MissingInConfigDependency.create(123, VALID_PATH, VALID_SEVERITY)).toThrow(
        'Name must be a non-empty string',
      );
    });

    it('should throw if path is invalid', () => {
      expect(() =>
        MissingInConfigDependency.create(VALID_NAME, {} as unknown as PathFinding, VALID_SEVERITY),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if severity is invalid', () => {
      expect(() =>
        MissingInConfigDependency.create(VALID_NAME, VALID_PATH, {} as unknown as SeverityFinding),
      ).toThrow('Invalid SeverityFinding');
    });

    it('should return false for different objects', () => {
      const base = MissingInConfigDependency.create(VALID_NAME, VALID_PATH, VALID_SEVERITY);

      const differentName = MissingInConfigDependency.create('react', VALID_PATH, VALID_SEVERITY);

      const differentPath = MissingInConfigDependency.create(
        VALID_NAME,
        PathFinding.create('docs/intro.md'),
        VALID_SEVERITY,
      );

      const differentSeverity = MissingInConfigDependency.create(
        VALID_NAME,
        VALID_PATH,
        SeverityFinding.create('LOW'),
      );

      expect(base.equals(differentName)).toBe(false);
      expect(base.equals(differentPath)).toBe(false);
      expect(base.equals(differentSeverity)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const dependency = MissingInConfigDependency.create(VALID_NAME, VALID_PATH, VALID_SEVERITY);

      expect(() => dependency.equals(null)).toThrow('Invalid argument');
      expect(() => dependency.equals({})).toThrow('Invalid argument');
    });
  });
});
