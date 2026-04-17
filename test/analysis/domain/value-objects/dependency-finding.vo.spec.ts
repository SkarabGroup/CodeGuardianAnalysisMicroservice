import { DependencyFinding } from '../../../../src/analysis/domain/value-objects/dependency-finding.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('DependencyFinding (Value Object)', () => {
  const VALID_PATH = PathFinding.create('package-lock.json');
  const VALID_SEVERITY = SeverityFinding.create('HIGH');
  const VALID_DESCRIPTION = DescriptionFinding.create('Test vulnerability');
  const VALID_REMEDIATION = DescriptionFinding.create('Update vm2 to version 3.9.18 or later');
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
        VALID_REMEDIATION,
      );

      expect(dep).toBeDefined();
    });

    it('should return true for equal objects', () => {
      const d1 = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
        VALID_REMEDIATION,
      );
      const d2 = DependencyFinding.create(
        PathFinding.create('package-lock.json'),
        'vm2',
        '3.9.17',
        'CVE-2023-1234',
        SeverityFinding.create('HIGH'),
        DescriptionFinding.create('Test vulnerability'),
        DescriptionFinding.create('Update vm2 to version 3.9.18 or later'),
      );

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const df = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
        VALID_REMEDIATION,
      );

      expect(df.getPathFinding()).toBe(VALID_PATH);
      expect(df.getPackageName()).toBe(VALID_PACKAGE_NAME);
      expect(df.getPackageVersion()).toBe(VALID_PACKAGE_VERSION);
      expect(df.getVulnerabilityId()).toBe(VALID_VULNERABILITY_ID);
      expect(df.getSeverityFinding()).toBe(VALID_SEVERITY);
      expect(df.getDescriptionFinding()).toBe(VALID_DESCRIPTION);
      expect(df.getRemediation()).toBe(VALID_REMEDIATION);
    });

    it('should trim string fields when creating an instance', () => {
      const df = DependencyFinding.create(
        VALID_PATH,
        '  my-package  ',
        '  1.0.0  ',
        '  CVE-2024-123  ',
        VALID_SEVERITY,
        VALID_DESCRIPTION,
        VALID_REMEDIATION,
      );

      expect(df.getPackageName()).toBe('my-package');
      expect(df.getPackageVersion()).toBe('1.0.0');
      expect(df.getVulnerabilityId()).toBe('CVE-2024-123');
    });
  });

  describe('Equality failure cases', () => {
    it('should return false for different objects', () => {
      const d1 = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
        VALID_REMEDIATION,
      );

      const d2 = DependencyFinding.create(
        VALID_PATH,
        'other-package',
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
        VALID_REMEDIATION,
      );

      expect(d1.equals(d2)).toBe(false);
    });

    it('should return false for different remediation', () => {
      const d1 = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
        VALID_REMEDIATION,
      );

      const otherRemediation = DescriptionFinding.create('Alternative remediation');
      const d2 = DependencyFinding.create(
        VALID_PATH,
        VALID_PACKAGE_NAME,
        VALID_PACKAGE_VERSION,
        VALID_VULNERABILITY_ID,
        VALID_SEVERITY,
        VALID_DESCRIPTION,
        otherRemediation,
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
        VALID_REMEDIATION,
      );

      expect(() => d.equals(null as unknown as DependencyFinding)).toThrow('Invalid argument');
      expect(() => d.equals({} as unknown as DependencyFinding)).toThrow('Invalid argument');
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
          VALID_REMEDIATION,
        ),
      ).toThrow('Package name must be a non-empty string');
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
          VALID_REMEDIATION,
        ),
      ).toThrow('Package version must be a non-empty string');
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
          VALID_REMEDIATION,
        ),
      ).toThrow('Vulnerability ID must be a non-empty string');
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
          VALID_REMEDIATION,
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
          VALID_REMEDIATION,
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
          VALID_REMEDIATION,
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
          VALID_REMEDIATION,
        ),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should throw if remediation is invalid', () => {
      expect(() =>
        DependencyFinding.create(
          VALID_PATH,
          VALID_PACKAGE_NAME,
          VALID_PACKAGE_VERSION,
          VALID_VULNERABILITY_ID,
          VALID_SEVERITY,
          VALID_DESCRIPTION,
          {} as unknown as DescriptionFinding,
        ),
      ).toThrow('Invalid DescriptionFinding');
    });
  });
});
