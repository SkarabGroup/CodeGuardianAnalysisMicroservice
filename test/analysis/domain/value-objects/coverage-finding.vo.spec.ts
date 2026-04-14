import { CoverageFinding } from '../../../../src/analysis/domain/value-objects/coverage-finding.vo';
import { FileCoverage } from '../../../../src/analysis/domain/value-objects/file-coverage.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { CoveragePercentage } from '../../../../src/analysis/domain/value-objects/coverage-percentage.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('CoverageFinding (Value Object)', () => {
  const PATH_1 = PathFinding.create('src/file1.ts');
  const PATH_2 = PathFinding.create('src/file2.ts');

  const LINE_50 = CoveragePercentage.create(0.5);
  const LINE_80 = CoveragePercentage.create(0.8);

  const VALID_HEALTH = DescriptionFinding.create('Low coverage on critical paths');
  const OTHER_HEALTH = DescriptionFinding.create('Good overall coverage');
  const VALID_FILE_REASONING = DescriptionFinding.create('Missing error handler branch');

  const VALID_FILE_1 = FileCoverage.create(PATH_1, LINE_50, [1, 2], 2, VALID_FILE_REASONING);
  const VALID_FILE_2 = FileCoverage.create(PATH_2, LINE_80, [3], 1, VALID_FILE_REASONING);

  describe('Success cases', () => {
    it('should create a valid CoverageFinding', () => {
      const cf = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, VALID_FILE_2]);
      expect(cf).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const cf = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, VALID_FILE_2]);

      expect(cf.getOverallHealth()).toBe(VALID_HEALTH);
      expect(cf.getCriticalFiles()).toEqual([VALID_FILE_1, VALID_FILE_2]);
    });

    it('should protect internal criticalFiles array (immutability)', () => {
      const cf = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1]);

      const files = cf.getCriticalFiles();
      files.push(VALID_FILE_2);

      expect(cf.getCriticalFiles()).toEqual([VALID_FILE_1]);
    });

    it('should allow empty criticalFiles array', () => {
      const cf = CoverageFinding.create(VALID_HEALTH, []);
      expect(cf.getCriticalFiles()).toEqual([]);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, VALID_FILE_2]);
      const b = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, VALID_FILE_2]);

      expect(a.equals(b)).toBe(true);
    });

    it('should return true for same files in different order', () => {
      const a = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, VALID_FILE_2]);
      const b = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_2, VALID_FILE_1]);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different overallHealth', () => {
      const a = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1]);
      const b = CoverageFinding.create(OTHER_HEALTH, [VALID_FILE_1]);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different files', () => {
      const a = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1]);
      const b = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_2]);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when criticalFiles have different lengths', () => {
      const a = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, VALID_FILE_2]);
      const b = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1]);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw if equals is called with invalid argument', () => {
      const cf = CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1]);

      expect(() => cf.equals(null as any)).toThrow('Invalid argument');
      expect(() => cf.equals({} as any)).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if overallHealth is not a DescriptionFinding', () => {
      expect(() =>
        CoverageFinding.create({} as any, [VALID_FILE_1]),
      ).toThrow('Invalid overallHealth');
    });

    it('should throw if criticalFiles is not an array', () => {
      expect(() =>
        CoverageFinding.create(VALID_HEALTH, null as any),
      ).toThrow('criticalFiles must be an array');
    });

    it('should throw if criticalFiles contains invalid elements', () => {
      expect(() =>
        CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, { invalid: 'object' } as any]),
      ).toThrow('Invalid FileCoverage');
    });

    it('should throw if two files have the same path', () => {
      const DUPLICATE = FileCoverage.create(PATH_1, LINE_80, [3], 1, VALID_FILE_REASONING);

      expect(() =>
        CoverageFinding.create(VALID_HEALTH, [VALID_FILE_1, DUPLICATE]),
      ).toThrow('Critical files must not contain duplicate paths');
    });
  });
});