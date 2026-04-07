import { DependencyFinding } from '../../../../src/analysis/domain/value-objects/dependency-finding.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('DependencyFinding (Value Object)', () => {
  const VALID_PATH = PathFinding.create('package-lock.json');
  const VALID_SEVERITY = SeverityFinding.create('HIGH');
  const VALID_DESCRIPTION = DescriptionFinding.create('Test vulnerability');
  const VALID_PACKAGE_NAME = 'vm2';
  const VALID_PACKAGE_VERSION = '3.9.17';
  const VALID_VULNERABILITY_ID = 'CVE-2023-1234';

  describe('Success cases', () => {
    it('should create a valid DependencyFinding instance', () => {
      const dep = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(dep).toBeDefined();
      expect(dep.path).toBe(VALID_PATH);
      expect(dep.packageName).toBe(VALID_PACKAGE_NAME);
      expect(dep.packageVersion).toBe(VALID_PACKAGE_VERSION);
      expect(dep.vulnerabilityId).toBe(VALID_VULNERABILITY_ID);
      expect(dep.severity).toBe(VALID_SEVERITY);
      expect(dep.description).toBe(VALID_DESCRIPTION);
    });

    it('should return true for equal objects', () => {
      const d1 = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );
      const d2 = DependencyFinding.create(
        PathFinding.create('package-lock.json'),
        'vm2',
        '3.9.17',
        'CVE-2023-1234',
        SeverityFinding.create('HIGH'),
        DescriptionFinding.create('Test vulnerability'),
      );

      expect(d1.equals(d2)).toBe(true);
    });
  });

  describe('Failure cases', () => {
    it('should throw if packageName is empty', () => {
      expect(() =>
        DependencyFinding.create(
          VALID_PATH,
          '',
          VALID_PACKAGE_VERSION,
          VALID_VULNERABILITY_ID,
          VALID_SEVERITY,
          VALID_DESCRIPTION,
        ),
      ).toThrow();
    });

    it('should throw if packageVersion is empty', () => {
      expect(() =>
        DependencyFinding.create(
          VALID_PATH,
          VALID_PACKAGE_NAME,
          '',
          VALID_VULNERABILITY_ID,
          VALID_SEVERITY,
          VALID_DESCRIPTION,
        ),
      ).toThrow();
    });

    it('should throw if vulnerabilityId is empty', () => {
      expect(() =>
        DependencyFinding.create(
          VALID_PATH,
          VALID_PACKAGE_NAME,
          VALID_PACKAGE_VERSION,
          '',
          VALID_SEVERITY,
          VALID_DESCRIPTION,
        ),
      ).toThrow();
    });

    it('should throw if vulnerability ID format is invalid', () => {
      expect(() =>
        DependencyFinding.create(
          VALID_PATH,
          VALID_PACKAGE_NAME,
          VALID_PACKAGE_VERSION,
          '#$%InvalidID',
          VALID_SEVERITY,
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid vulnerability ID format');
    });

    it('should throw if path is invalid', () => {
      expect(() =>
        DependencyFinding.create(
          {} as unknown as PathFinding,
          VALID_PACKAGE_NAME,
          VALID_PACKAGE_VERSION,
          VALID_VULNERABILITY_ID,
          VALID_SEVERITY,
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if severity is invalid', () => {
      expect(() =>
        DependencyFinding.create(
          VALID_PATH,
          VALID_PACKAGE_NAME,
          VALID_PACKAGE_VERSION,
          VALID_VULNERABILITY_ID,
          {} as unknown as SeverityFinding,
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid SeverityFinding');
    });

    it('should throw if description is invalid', () => {
      expect(() =>
        DependencyFinding.create(
          VALID_PATH,
          VALID_PACKAGE_NAME,
          VALID_PACKAGE_VERSION,
          VALID_VULNERABILITY_ID,
          VALID_SEVERITY,
          {} as unknown as DescriptionFinding,
        ),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should return false for different objects', () => {
      const d1 = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      const d2 = DependencyFinding.create(
        VALID_PATH,
        'other-package',
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(d1.equals(d2)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const d = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
      );

      expect(() => d.equals(null)).toThrow('Invalid argument');
      expect(() => d.equals({})).toThrow('Invalid argument');
    });
  });
});
