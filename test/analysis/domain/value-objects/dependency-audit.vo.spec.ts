import { DependencyAudit } from '../../../../src/analysis/domain/value-objects/dependency-audit.vo';
import { ReadmeDependency } from '../../../../src/analysis/domain/value-objects/readme-dependency.vo';
import { ConfigDependency } from '../../../../src/analysis/domain/value-objects/config-dependency.vo';
import { MissingInConfigDependency } from '../../../../src/analysis/domain/value-objects/missing-in-config-dependency.vo';
import { UndocumentedDependency } from '../../../../src/analysis/domain/value-objects/undocumented-dependency.vo';
import { VersionMismatchDependency } from '../../../../src/analysis/domain/value-objects/version-mismatch-dependency.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';

describe('DependencyAudit (Value Object)', () => {
  const MOCK_PATH = PathFinding.create('package.json');
  const MOCK_SEVERITY = SeverityFinding.create('MEDIUM');

  const validReadmeDep = ReadmeDependency.create('react', '^18.0.0');
  const validConfigDep = ConfigDependency.create('react', '^18.0.0', MOCK_PATH);
  const validMissingDep = MissingInConfigDependency.create('lodash', MOCK_PATH, MOCK_SEVERITY);
  const validUndocumentedDep = UndocumentedDependency.create('axios', MOCK_PATH);
  const validMismatchDep = VersionMismatchDependency.create(
    'express',
    '^4.17.0',
    '^4.18.2',
    MOCK_PATH,
  );

  describe('Success cases', () => {
    it('should create an instance with empty arrays if no props are provided', () => {
      const audit = DependencyAudit.create();

      expect(audit).toBeDefined();
      expect(audit.getReadmeDefined()).toEqual([]);
      expect(audit.getConfigDefined()).toEqual([]);
      expect(audit.getMissingInConfig()).toEqual([]);
      expect(audit.getUndocumentedInReadme()).toEqual([]);
      expect(audit.getVersionMismatches()).toEqual([]);
    });

    it('should create a valid DependencyAudit instance with populated arrays', () => {
      const audit = DependencyAudit.create({
        readmeDefined: [validReadmeDep],
        configDefined: [validConfigDep],
        missingInConfig: [validMissingDep],
        undocumentedInReadme: [validUndocumentedDep],
        versionMismatches: [validMismatchDep],
      });

      expect(audit.getReadmeDefined().length).toBe(1);
      expect(audit.getConfigDefined().length).toBe(1);
      expect(audit.getMissingInConfig().length).toBe(1);
      expect(audit.getUndocumentedInReadme().length).toBe(1);
      expect(audit.getVersionMismatches().length).toBe(1);
    });

    it('should return true for equal objects', () => {
      const audit1 = DependencyAudit.create({ readmeDefined: [validReadmeDep] });
      const audit2 = DependencyAudit.create({ readmeDefined: [validReadmeDep] });

      expect(audit1.equals(audit2)).toBe(true);
    });

    it('should return true for equal objects even if arrays are in different order', () => {
      const depA = ReadmeDependency.create('A-package', '1.0.0');
      const depB = ReadmeDependency.create('B-package', '2.0.0');

      const audit1 = DependencyAudit.create({ readmeDefined: [depA, depB] });
      const audit2 = DependencyAudit.create({ readmeDefined: [depB, depA] });

      expect(audit1.equals(audit2)).toBe(true);
    });
  });

  describe('Failure cases', () => {
    describe('Invalid Input Types (Not Arrays)', () => {
      it('should throw if readmeDefined is not an array', () => {
        expect(() =>
          DependencyAudit.create({ readmeDefined: 'invalid' as unknown as ReadmeDependency[] }),
        ).toThrow('readmeDefined must be an array');
      });

      it('should throw if configDefined is not an array', () => {
        expect(() =>
          DependencyAudit.create({ configDefined: {} as unknown as ConfigDependency[] }),
        ).toThrow('configDefined must be an array');
      });

      it('should throw if missingInConfig is not an array', () => {
        expect(() =>
          DependencyAudit.create({
            missingInConfig: 123 as unknown as MissingInConfigDependency[],
          }),
        ).toThrow('missingInConfig must be an array');
      });

      it('should throw if undocumentedInReadme is not an array', () => {
        expect(() =>
          DependencyAudit.create({
            undocumentedInReadme: true as unknown as UndocumentedDependency[],
          }),
        ).toThrow('undocumentedInReadme must be an array');
      });

      it('should throw if versionMismatches is not an array', () => {
        expect(() =>
          DependencyAudit.create({
            versionMismatches: 'string' as unknown as VersionMismatchDependency[],
          }),
        ).toThrow('versionMismatches must be an array');
      });
    });

    describe('Invalid Instances inside Arrays', () => {
      it('should throw if items in readmeDefined are invalid', () => {
        expect(() => DependencyAudit.create({ readmeDefined: [{}] })).toThrow(
          'Invalid ReadmeDependency',
        );
      });

      it('should throw if items in configDefined are invalid', () => {
        expect(() => DependencyAudit.create({ configDefined: [{}] })).toThrow(
          'Invalid ConfigDependency',
        );
      });

      it('should throw if items in missingInConfig are invalid', () => {
        expect(() => DependencyAudit.create({ missingInConfig: [{}] })).toThrow(
          'Invalid MissingInConfigDependency',
        );
      });

      it('should throw if items in undocumentedInReadme are invalid', () => {
        expect(() => DependencyAudit.create({ undocumentedInReadme: [{}] })).toThrow(
          'Invalid UndocumentedDependency',
        );
      });

      it('should throw if items in versionMismatches are invalid', () => {
        expect(() => DependencyAudit.create({ versionMismatches: [{}] })).toThrow(
          'Invalid VersionMismatchDependency',
        );
      });
    });

    describe('Equality and Comparison', () => {
      it('should return false if arrays have different lengths', () => {
        const audit1 = DependencyAudit.create({ readmeDefined: [validReadmeDep] });
        const audit2 = DependencyAudit.create({ readmeDefined: [] });

        expect(audit1.equals(audit2)).toBe(false);
      });

      it('should return false if arrays have different items', () => {
        const audit1 = DependencyAudit.create({
          readmeDefined: [validReadmeDep],
        });
        const audit2 = DependencyAudit.create({
          readmeDefined: [ReadmeDependency.create('different-package', '1.0.0')],
        });

        expect(audit1.equals(audit2)).toBe(false);
      });

      it('should throw when comparing with invalid object', () => {
        const audit = DependencyAudit.create();

        expect(() => audit.equals(null)).toThrow('Invalid argument');
        expect(() => audit.equals({})).toThrow('Invalid argument');
      });
    });
  });
});
