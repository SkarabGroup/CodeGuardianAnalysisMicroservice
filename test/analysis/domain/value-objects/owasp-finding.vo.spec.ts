import { OWASPFinding } from '../../../../src/analysis/domain/value-objects/owasp-finding.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { ErrorFinding } from '../../../../src/analysis/domain/value-objects/error-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';

describe('OWASPFinding (Value Object)', () => {
  const PATH = PathFinding.create('src/file.ts');
  const DESCRIPTION = DescriptionFinding.create('SQL Injection vulnerability');
  const SEVERITY = SeverityFinding.create('HIGH');
  const ERROR = ErrorFinding.create(10, DESCRIPTION, SEVERITY);

  const CATEGORY = 'A03:2021-Injection';
  const RULE_ID = 'ts-sqli-rule-01';
  const REMEDIATION = DescriptionFinding.create(
    'Use parameterized queries to prevent SQL injection',
  );

  describe('Success cases', () => {
    it('should create a valid OWASPFinding', () => {
      const finding = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      expect(finding).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const finding = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);

      expect(finding.getPathFinding()).toBe(PATH);
      expect(finding.getErrorFinding()).toBe(ERROR);
      expect(finding.getOWASPCategory()).toBe(CATEGORY);
      expect(finding.getRuleId()).toBe(RULE_ID);
      expect(finding.getRemediation()).toBe(REMEDIATION);
    });

    it('should trim OWASP category and ruleId', () => {
      const finding = OWASPFinding.create(
        PATH,
        ERROR,
        '  A03:2021-Injection  ',
        '  ts-sqli-rule-01  ',
        REMEDIATION,
      );
      expect(finding.getOWASPCategory()).toBe('A03:2021-Injection');
      expect(finding.getRuleId()).toBe('ts-sqli-rule-01');
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different category', () => {
      const a = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = OWASPFinding.create(PATH, ERROR, 'A02:Broken Auth', RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different ruleId', () => {
      const a = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = OWASPFinding.create(PATH, ERROR, CATEGORY, 'other-rule-id', REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different path', () => {
      const otherPath = PathFinding.create('src/other.ts');

      const a = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = OWASPFinding.create(otherPath, ERROR, CATEGORY, RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different error', () => {
      const otherError = ErrorFinding.create(20, DESCRIPTION, SEVERITY);

      const a = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = OWASPFinding.create(PATH, otherError, CATEGORY, RULE_ID, REMEDIATION);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different remediation', () => {
      const otherRemediation = DescriptionFinding.create('Sanitize inputs properly');

      const a = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);
      const b = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, otherRemediation);

      expect(a.equals(b)).toBe(false);
    });

    it('should throw error if equals is called with invalid argument', () => {
      const finding = OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, REMEDIATION);

      expect(() => finding.equals(null as unknown as OWASPFinding)).toThrow('Invalid argument');
      expect(() => finding.equals({} as unknown as OWASPFinding)).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if OWASP category is not a string or is empty', () => {
      expect(() =>
        OWASPFinding.create(PATH, ERROR, null as unknown as string, RULE_ID, REMEDIATION),
      ).toThrow('Owasp category must be a non-empty string');

      expect(() => OWASPFinding.create(PATH, ERROR, '   ', RULE_ID, REMEDIATION)).toThrow(
        'Owasp category must be a non-empty string',
      );
    });

    it('should throw if ruleId is not a string or is empty', () => {
      expect(() =>
        OWASPFinding.create(PATH, ERROR, CATEGORY, null as unknown as string, REMEDIATION),
      ).toThrow('Rule id must be a non-empty string');

      expect(() => OWASPFinding.create(PATH, ERROR, CATEGORY, '   ', REMEDIATION)).toThrow(
        'Rule id must be a non-empty string',
      );
    });

    it('should throw if PathFinding is invalid', () => {
      expect(() =>
        OWASPFinding.create(null as unknown as PathFinding, ERROR, CATEGORY, RULE_ID, REMEDIATION),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if ErrorFinding is invalid', () => {
      expect(() =>
        OWASPFinding.create(PATH, null as unknown as ErrorFinding, CATEGORY, RULE_ID, REMEDIATION),
      ).toThrow('Invalid ErrorFinding');
    });

    it('should throw if remediation is invalid', () => {
      expect(() => OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, null)).toThrow(
        'Invalid DescriptionFinding',
      );
      expect(() => OWASPFinding.create(PATH, ERROR, CATEGORY, RULE_ID, {})).toThrow(
        'Invalid DescriptionFinding',
      );
    });
  });
});
