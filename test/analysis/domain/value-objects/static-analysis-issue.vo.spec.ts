import { StaticAnalysisIssue } from '../../../../src/analysis/domain/value-objects/static-analysis-issue.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { PositionFinding } from '../../../../src/analysis/domain/value-objects/position-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';

describe('StaticAnalysisIssue (Value Object)', () => {
  const VALID_PATH = PathFinding.create('src/file.ts');
  const OTHER_PATH = PathFinding.create('src/other.ts');
  const VALID_POSITION = PositionFinding.create(1, 5, 0);
  const OTHER_POSITION = PositionFinding.create(10, 20, 3);
  const VALID_SEVERITY = SeverityFinding.create(SeverityLevel.HIGH);
  const OTHER_SEVERITY = SeverityFinding.create(SeverityLevel.LOW);
  const VALID_RULE = 'no-unused-vars';
  const VALID_ORIGINAL = DescriptionFinding.create('Unused variable detected');
  const VALID_REASONING = DescriptionFinding.create('Variable x is declared but never used');
  const VALID_RESOLUTION = DescriptionFinding.create('Remove the variable or use it');

  describe('Success cases', () => {
    it('should create a valid StaticAnalysisIssue', () => {
      const issue = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      expect(issue).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const issue = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      expect(issue.getPathFinding()).toBe(VALID_PATH);
      expect(issue.getPosition()).toBe(VALID_POSITION);
      expect(issue.getRule()).toBe(VALID_RULE);
      expect(issue.getSeverityFinding()).toBe(VALID_SEVERITY);
      expect(issue.getOriginalDescription()).toBe(VALID_ORIGINAL);
      expect(issue.getAiReasoning()).toBe(VALID_REASONING);
      expect(issue.getSuggestedResolution()).toBe(VALID_RESOLUTION);
    });

    it('should trim rule whitespace', () => {
      const issue = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, '  no-unused-vars  ', VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      expect(issue.getRule()).toBe(VALID_RULE);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      const b = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different path', () => {
      const a = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      const b = StaticAnalysisIssue.create(
        OTHER_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different position', () => {
      const a = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      const b = StaticAnalysisIssue.create(
        VALID_PATH, OTHER_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different rule', () => {
      const a = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      const b = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, 'no-explicit-any', VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different severity', () => {
      const a = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      const b = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, OTHER_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      expect(a.equals(b)).toBe(false);
    });

    it('should return true even if descriptions differ (not part of identity)', () => {
      const OTHER_DESCRIPTION = DescriptionFinding.create('Different description');
      const a = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      const b = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, OTHER_DESCRIPTION, OTHER_DESCRIPTION, OTHER_DESCRIPTION,
      );

      expect(a.equals(b)).toBe(true);
    });

    it('should throw if equals is called with invalid argument', () => {
      const issue = StaticAnalysisIssue.create(
        VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      expect(() => issue.equals(null as any)).toThrow('Invalid argument');
      expect(() => issue.equals({} as any)).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if path is not a PathFinding', () => {
      expect(() =>
        StaticAnalysisIssue.create({} as unknown as PathFinding, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if position is not a PositionFinding', () => {
      expect(() =>
        StaticAnalysisIssue.create(VALID_PATH, {} as unknown as PositionFinding, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION),
      ).toThrow('Invalid Position');
    });

    it('should throw if rule is not a string', () => {
      expect(() =>
        StaticAnalysisIssue.create(VALID_PATH, VALID_POSITION, 123, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION),
      ).toThrow('Rule must be a string');
    });

    it('should throw if rule is an empty string', () => {
      expect(() =>
        StaticAnalysisIssue.create(VALID_PATH, VALID_POSITION, '   ', VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION),
      ).toThrow('Rule must be a non-empty string');
    });

    it('should throw if severity is not a SeverityFinding', () => {
      expect(() =>
        StaticAnalysisIssue.create(VALID_PATH, VALID_POSITION, VALID_RULE, {} as unknown as SeverityFinding, VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION),
      ).toThrow('Invalid SeverityFinding');
    });

    it('should throw if originalDescription is not a DescriptionFinding', () => {
      expect(() =>
        StaticAnalysisIssue.create(VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, {} as unknown as DescriptionFinding, VALID_REASONING, VALID_RESOLUTION),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should throw if aiReasoning is not a DescriptionFinding', () => {
      expect(() =>
        StaticAnalysisIssue.create(VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, {} as unknown as DescriptionFinding, VALID_RESOLUTION),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should throw if suggestedResolution is not a DescriptionFinding', () => {
      expect(() =>
        StaticAnalysisIssue.create(VALID_PATH, VALID_POSITION, VALID_RULE, VALID_SEVERITY, VALID_ORIGINAL, VALID_REASONING, {} as unknown as DescriptionFinding),
      ).toThrow('Invalid DescriptionFinding');
    });
  });
});