import { FileCoverage } from '../../../../src/analysis/domain/value-objects/file-coverage.vo';
import { CoveragePercentage } from '../../../../src/analysis/domain/value-objects/coverage-percentage.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('FileCoverage (Value Object)', () => {
  const VALID_PATH = PathFinding.create('src/file.ts');
  const OTHER_PATH = PathFinding.create('src/other.ts');
  const LINES_50 = CoveragePercentage.create(0.5);
  const LINES_80 = CoveragePercentage.create(0.8);
  const FULL_COVERAGE = CoveragePercentage.create(1);
  const VALID_REASONING = DescriptionFinding.create('Missing auth branch and error handler');

  describe('Success cases', () => {
    it('should create a valid FileCoverage instance', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 3], 2, VALID_REASONING);
      expect(fc).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 3], 2, VALID_REASONING);

      expect(fc.getPathFinding()).toBe(VALID_PATH);
      expect(fc.getLinesPercentage()).toBe(LINES_50);
      expect(fc.getMissingLines()).toEqual([1, 2, 3]);
      expect(fc.getMissingBranches()).toBe(2);
      expect(fc.getAiReasoning()).toBe(VALID_REASONING);
    });

    it('should protect internal missingLines array (immutability)', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 3], 0, VALID_REASONING);

      const lines = fc.getMissingLines();
      lines.push(999);

      expect(fc.getMissingLines()).toEqual([1, 2, 3]);
    });

    it('should allow empty missingLines when coverage is not 100%', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, [], 0, VALID_REASONING);
      expect(fc.getMissingLines()).toEqual([]);
    });

    it('should allow missingBranches of 0', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, [1], 0, VALID_REASONING);
      expect(fc.getMissingBranches()).toBe(0);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 3], 2, VALID_REASONING);
      const b = FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 3], 2, VALID_REASONING);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different paths', () => {
      const a = FileCoverage.create(VALID_PATH, LINES_50, [1], 0, VALID_REASONING);
      const b = FileCoverage.create(OTHER_PATH, LINES_50, [1], 0, VALID_REASONING);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different linesPercentage', () => {
      const a = FileCoverage.create(VALID_PATH, LINES_50, [1], 0, VALID_REASONING);
      const b = FileCoverage.create(VALID_PATH, LINES_80, [1], 0, VALID_REASONING);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different missingLines', () => {
      const a = FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 3], 0, VALID_REASONING);
      const b = FileCoverage.create(VALID_PATH, LINES_50, [1, 2], 0, VALID_REASONING);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different missingBranches', () => {
      const a = FileCoverage.create(VALID_PATH, LINES_50, [1], 1, VALID_REASONING);
      const b = FileCoverage.create(VALID_PATH, LINES_50, [1], 3, VALID_REASONING);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw if equals is called with invalid argument', () => {
      const fc = FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 3], 0, VALID_REASONING);

      expect(() => fc.equals(null as any)).toThrow('Invalid argument');
      expect(() => fc.equals({} as any)).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if pathFinding is not a PathFinding instance', () => {
      expect(() =>
        FileCoverage.create({} as any, LINES_50, [1], 0, VALID_REASONING),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if linesPercentage is not a CoveragePercentage instance', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, {} as any, [1], 0, VALID_REASONING),
      ).toThrow('Invalid linesPercentage');
    });

    it('should throw if missingLines is not an array', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, null as any, 0, VALID_REASONING),
      ).toThrow('missingLines must be an array');
    });

    it('should throw if missingBranches is not a number', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, [1], '2' as any, VALID_REASONING),
      ).toThrow('missingBranches must be a number');
    });

    it('should throw if aiReasoning is not a DescriptionFinding instance', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, [1], 0, {} as any),
      ).toThrow('Invalid aiReasoning');
    });

    it('should throw if missingLines contains values <= 0', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, [0, 1], 0, VALID_REASONING),
      ).toThrow('Line numbers must be positive integers');
    });

    it('should throw if missingLines contains non-integers', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, [1.5, 2], 0, VALID_REASONING),
      ).toThrow('Line numbers must be positive integers');
    });

    it('should throw if missingLines contains duplicates', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, [1, 2, 2], 0, VALID_REASONING),
      ).toThrow('Missing lines must not contain duplicates');
    });

    it('should throw if missingBranches is negative', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, [1], -1, VALID_REASONING),
      ).toThrow('missingBranches must be a non-negative integer');
    });

    it('should throw if missingBranches is not an integer', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, LINES_50, [1], 1.5, VALID_REASONING),
      ).toThrow('missingBranches must be a non-negative integer');
    });

    it('should throw if coverage is 100% but missingLines is not empty', () => {
      expect(() =>
        FileCoverage.create(VALID_PATH, FULL_COVERAGE, [1], 0, VALID_REASONING),
      ).toThrow('Missing lines must be empty when line coverage is 100%');
    });
  });
});