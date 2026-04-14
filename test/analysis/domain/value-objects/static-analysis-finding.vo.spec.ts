import { StaticAnalysisFinding } from '../../../../src/analysis/domain/value-objects/static-analysis-finding.vo';
import { StaticAnalysisIssue } from '../../../../src/analysis/domain/value-objects/static-analysis-issue.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { PositionFinding } from '../../../../src/analysis/domain/value-objects/position-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';

describe('StaticAnalysisFinding (Value Object)', () => {
  const VALID_PATH_1 = PathFinding.create('src/file1.ts');
  const VALID_PATH_2 = PathFinding.create('src/file2.ts');
  const VALID_POSITION = PositionFinding.create(1, 5, 0);
  const VALID_SEVERITY = SeverityFinding.create(SeverityLevel.HIGH);
  const VALID_ORIGINAL = DescriptionFinding.create('Unused variable detected');
  const VALID_REASONING = DescriptionFinding.create('Variable x is declared but never used');
  const VALID_RESOLUTION = DescriptionFinding.create('Remove the variable or use it');

  const VALID_ISSUE_1 = StaticAnalysisIssue.create(
    VALID_PATH_1, VALID_POSITION, 'no-unused-vars', VALID_SEVERITY,
    VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
  );
  const VALID_ISSUE_2 = StaticAnalysisIssue.create(
    VALID_PATH_2, VALID_POSITION, 'no-explicit-any', VALID_SEVERITY,
    VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
  );

  describe('Success cases', () => {
    it('should create a valid StaticAnalysisFinding', () => {
      const finding = StaticAnalysisFinding.create(2, [VALID_ISSUE_1, VALID_ISSUE_2]);
      expect(finding).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const finding = StaticAnalysisFinding.create(2, [VALID_ISSUE_1, VALID_ISSUE_2]);

      expect(finding.getTotalIssues()).toBe(2);
      expect(finding.getIssues()).toEqual([VALID_ISSUE_1, VALID_ISSUE_2]);
    });

    it('should protect internal issues array (immutability)', () => {
      const finding = StaticAnalysisFinding.create(1, [VALID_ISSUE_1]);

      const issues = finding.getIssues();
      issues.push(VALID_ISSUE_2);

      expect(finding.getIssues()).toEqual([VALID_ISSUE_1]);
    });

    it('should allow totalIssues of 0 with empty array', () => {
      const finding = StaticAnalysisFinding.create(0, []);
      expect(finding.getTotalIssues()).toBe(0);
      expect(finding.getIssues()).toEqual([]);
    });

    it('should allow totalIssues greater than issues array length', () => {
      const finding = StaticAnalysisFinding.create(100, [VALID_ISSUE_1]);
      expect(finding.getTotalIssues()).toBe(100);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = StaticAnalysisFinding.create(2, [VALID_ISSUE_1, VALID_ISSUE_2]);
      const b = StaticAnalysisFinding.create(2, [VALID_ISSUE_1, VALID_ISSUE_2]);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different totalIssues', () => {
      const a = StaticAnalysisFinding.create(2, [VALID_ISSUE_1]);
      const b = StaticAnalysisFinding.create(5, [VALID_ISSUE_1]);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different issues array length', () => {
      const a = StaticAnalysisFinding.create(2, [VALID_ISSUE_1, VALID_ISSUE_2]);
      const b = StaticAnalysisFinding.create(2, [VALID_ISSUE_1]);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different issues content', () => {
      const a = StaticAnalysisFinding.create(1, [VALID_ISSUE_1]);
      const b = StaticAnalysisFinding.create(1, [VALID_ISSUE_2]);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw if equals is called with invalid argument', () => {
      const finding = StaticAnalysisFinding.create(1, [VALID_ISSUE_1]);

      expect(() => finding.equals(null as any)).toThrow('Invalid argument');
      expect(() => finding.equals({} as any)).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if totalIssues is not a number', () => {
      expect(() =>
        StaticAnalysisFinding.create('2' as any, [VALID_ISSUE_1]),
      ).toThrow('totalIssues must be a number');
    });

    it('should throw if totalIssues is negative', () => {
      expect(() =>
        StaticAnalysisFinding.create(-1, [VALID_ISSUE_1]),
      ).toThrow('totalIssues must be a non-negative integer');
    });

    it('should throw if totalIssues is not an integer', () => {
      expect(() =>
        StaticAnalysisFinding.create(1.5, [VALID_ISSUE_1]),
      ).toThrow('totalIssues must be a non-negative integer');
    });

    it('should throw if issues is not an array', () => {
      expect(() =>
        StaticAnalysisFinding.create(1, null as any),
      ).toThrow('issues must be an array');
    });

    it('should throw if issues array contains invalid elements', () => {
      expect(() =>
        StaticAnalysisFinding.create(1, [{ invalid: 'object' } as any]),
      ).toThrow('Invalid StaticAnalysisIssue');
    });
  });
});