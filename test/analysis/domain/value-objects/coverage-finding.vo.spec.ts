import { CoverageFinding } from '../../../../src/analysis/domain/value-objects/coverage-finding.vo';
import { CoveragePercentage } from '../../../../src/analysis/domain/value-objects/coverage-percentage.vo';
import { FileCoverage } from '../../../../src/analysis/domain/value-objects/file-coverage.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SupportedLanguages } from '../../../../src/analysis/domain/enums/supported-languages.enum';

describe('CoverageFinding (Value Object)', () => {
  const PATH_1 = PathFinding.create('src/file1.ts');
  const PATH_2 = PathFinding.create('src/file2.ts');

  const LINE_50 = CoveragePercentage.create(0.5);
  const LINE_80 = CoveragePercentage.create(0.8);
  const BRANCH_40 = CoveragePercentage.create(0.4);
  const BRANCH_70 = CoveragePercentage.create(0.7);
  const ZERO = CoveragePercentage.create(0);

  const VALID_LANGUAGE = 'typescript';

  const FILE_1 = FileCoverage.create(PATH_1, LINE_50, BRANCH_40, [1, 2]);
  const FILE_2 = FileCoverage.create(PATH_2, LINE_80, BRANCH_70, [3]);

  describe('Success cases', () => {
    it('should create a valid CoverageFinding', () => {
      const cf = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1, FILE_2], VALID_LANGUAGE);
      expect(cf).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const cf = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1, FILE_2], VALID_LANGUAGE);

      expect(cf.getTotalLinesPercentage()).toBe(LINE_80);
      expect(cf.getTotalBranchesPercentage()).toBe(BRANCH_70);
      expect(cf.getCoverageFiles()).toEqual([FILE_1, FILE_2]);
      expect(cf.getAnalyzedLanguage()).toBe(SupportedLanguages.TYPESCRIPT);
    });

    it('should protect internal coverageFiles array (immutability)', () => {
      const cf = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1], VALID_LANGUAGE);

      const files = cf.getCoverageFiles();
      files.push(FILE_2);

      expect(cf.getCoverageFiles()).toEqual([FILE_1]);
    });

    it('should allow empty array when coverage is 0', () => {
      const cf = CoverageFinding.create(ZERO, ZERO, [], VALID_LANGUAGE);
      expect(cf.getCoverageFiles()).toEqual([]);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1, FILE_2], VALID_LANGUAGE);
      const b = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1, FILE_2], VALID_LANGUAGE);

      expect(a.equals(b)).toBe(true);
    });

    it('should return true for same files in different order', () => {
      const a = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1, FILE_2], VALID_LANGUAGE);
      const b = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_2, FILE_1], VALID_LANGUAGE);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different totals', () => {
      const a = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1], VALID_LANGUAGE);
      const b = CoverageFinding.create(LINE_50, BRANCH_70, [FILE_1], VALID_LANGUAGE);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different files', () => {
      const a = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1], VALID_LANGUAGE);
      const b = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_2], VALID_LANGUAGE);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when coverageFiles have different lengths', () => {
      const a = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1, FILE_2], VALID_LANGUAGE);
      const b = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1], VALID_LANGUAGE);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw error if equals is called with invalid argument', () => {
      const cf = CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1], VALID_LANGUAGE);

      expect(() => cf.equals(null)).toThrow('Invalid argument');

      expect(() => cf.equals({})).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if coverageFiles is not an array', () => {
      expect(() => CoverageFinding.create(LINE_80, BRANCH_70, null, VALID_LANGUAGE)).toThrow(
        'Coverage files must be an array',
      );
    });

    it('should throw if two files have the same path', () => {
      const duplicateFile = FileCoverage.create(PATH_1, LINE_50, BRANCH_40, [3]);

      expect(() =>
        CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1, duplicateFile], VALID_LANGUAGE),
      ).toThrow('Two files cannot have the same path');
    });

    it('should throw if array is empty but coverage is not 0', () => {
      expect(() => CoverageFinding.create(LINE_80, BRANCH_70, [], VALID_LANGUAGE)).toThrow(
        'Total lines and branches coverage must be 0 when no files are present',
      );
    });

    it('should throw if lines = 0 but branches != 0', () => {
      expect(() => CoverageFinding.create(ZERO, BRANCH_40, [FILE_1], VALID_LANGUAGE)).toThrow(
        'Total branch coverage must be 0 when line coverage is 0',
      );
    });

    it('should throw if language is not supported by the enum', () => {
      expect(() => CoverageFinding.create(LINE_80, BRANCH_70, [FILE_1], 'CSHARP')).toThrow(
        'Invalid analyzed language',
      );
    });

    it('should throw if totalLinesPercentage is not an instance of CoveragePercentage', () => {
      expect(() =>
        CoverageFinding.create(
          {} as unknown as CoveragePercentage,
          BRANCH_70,
          [FILE_1],
          VALID_LANGUAGE,
        ),
      ).toThrow('Invalid totalLinesPercentage');
    });

    it('should throw if totalBranchesPercentage is not an instance of CoveragePercentage', () => {
      expect(() =>
        CoverageFinding.create(
          LINE_80,
          {} as unknown as CoveragePercentage,
          [FILE_1],
          VALID_LANGUAGE,
        ),
      ).toThrow('Invalid totalBranchesPercentage');
    });

    it('should throw if the coverageFiles array contains invalid elements', () => {
      expect(() =>
        CoverageFinding.create(
          LINE_80,
          BRANCH_70,
          [FILE_1, { invalid: 'object' } as unknown as FileCoverage],
          VALID_LANGUAGE,
        ),
      ).toThrow('Invalid FileCoverage');
    });
  });
});
