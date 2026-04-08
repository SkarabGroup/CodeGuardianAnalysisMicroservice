import { FileCoverage } from '../../../../src/analysis/domain/value-objects/code/file-coverage.vo';
import { CoveragePercentage } from '../../../../src/analysis/domain/value-objects/code/coverage-percentage.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';

describe('FileCoverage (Value Object)', () => {
  const VALID_PATH = PathFinding.create('src/file.ts');
  const LINES_50 = CoveragePercentage.create(0.5);
  const BRANCHES_40 = CoveragePercentage.create(0.4);

  describe('Success cases', () => {
    it('should create a valid FileCoverage instance', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 3]);

      expect(fc).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 3]);

      expect(fc.getPath()).toBe(VALID_PATH);
      expect(fc.getLinesPercentage()).toBe(LINES_50);
      expect(fc.getBranchesPercentage()).toBe(BRANCHES_40);
      expect(fc.getMissedLines()).toEqual([1, 2, 3]);
    });

    it('should protect internal missedLines array (immutability)', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 3]);

      const lines = fc.getMissedLines();
      lines.push(999);

      expect(fc.getMissedLines()).toEqual([1, 2, 3]);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 3]);

      const b = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 3]);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different objects', () => {
      const a = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 3]);

      const b = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2]);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw error if equals is called with invalid argument', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 3]);

      expect(() => fc.equals(null)).toThrow('Invalid argument');

      expect(() => fc.equals({})).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if missedLines contains values <= 0', () => {
      expect(() => FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [0, 1])).toThrow(
        'Line numbers must be greater than 0',
      );
    });

    it('should throw if missedLines contains non-integers', () => {
      expect(() => FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1.5, 2])).toThrow(
        'Line numbers must be integers',
      );
    });

    it('should throw if missedLines contains duplicates', () => {
      expect(() => FileCoverage.create(VALID_PATH, LINES_50, BRANCHES_40, [1, 2, 2])).toThrow(
        'Missed lines must not contain duplicates',
      );
    });

    it('should throw if coverage is 100% but missedLines is not empty', () => {
      const FULL_COVERAGE = CoveragePercentage.create(1);

      expect(() => FileCoverage.create(VALID_PATH, FULL_COVERAGE, BRANCHES_40, [1])).toThrow(
        'Missed lines must be empty when coverage is 100%',
      );
    });
  });
});
