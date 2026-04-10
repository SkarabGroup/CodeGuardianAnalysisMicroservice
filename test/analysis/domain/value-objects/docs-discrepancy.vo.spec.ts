import { DocsDiscrepancy } from '../../../../src/analysis/domain/value-objects/docs-discrepancy.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('DocsDiscrepancy (Value Object)', () => {
  const VALID_PATH = PathFinding.create('swagger.json');
  const VALID_SEVERITY = SeverityFinding.create('MEDIUM');
  const VALID_CATEGORY = 'documentation_mismatch';
  const VALID_CLAIM = DescriptionFinding.create('The API should return a 200 OK');
  const VALID_ACTUAL = DescriptionFinding.create('The API returned a 404 Not Found');

  describe('Success cases', () => {
    it('should create a valid DocsDiscrepancy instance', () => {
      const discrepancy = DocsDiscrepancy.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_SEVERITY,
        VALID_CLAIM,
        VALID_ACTUAL,
      );

      expect(discrepancy).toBeDefined();
      expect(discrepancy).toBeInstanceOf(DocsDiscrepancy);
    });

    it('should return true for equal objects', () => {
      const d1 = DocsDiscrepancy.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_SEVERITY,
        VALID_CLAIM,
        VALID_ACTUAL,
      );
      const d2 = DocsDiscrepancy.create(
        PathFinding.create('swagger.json'),
        'documentation_mismatch',
        SeverityFinding.create('MEDIUM'),
        DescriptionFinding.create('The API should return a 200 OK'),
        DescriptionFinding.create('The API returned a 404 Not Found'),
      );

      expect(d1.equals(d2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const discrepancy = DocsDiscrepancy.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_SEVERITY,
        VALID_CLAIM,
        VALID_ACTUAL,
      );

      expect(discrepancy.getPathFinding()).toBe(VALID_PATH);
      expect(discrepancy.getDiscrepancyCategory()).toBe(VALID_CATEGORY);
      expect(discrepancy.getSeverityFinding()).toBe(VALID_SEVERITY);
      expect(discrepancy.getDocsClaim()).toBe(VALID_CLAIM);
      expect(discrepancy.getActualFinding()).toBe(VALID_ACTUAL);
    });

    it('should trim the category string when creating an instance', () => {
      const discrepancy = DocsDiscrepancy.create(
        VALID_PATH,
        '  mismatch  ',
        VALID_SEVERITY,
        VALID_CLAIM,
        VALID_ACTUAL,
      );

      expect(discrepancy.getDiscrepancyCategory()).toBe('mismatch');
    });
  });

  describe('Failure cases', () => {
    it('should throw if category is empty', () => {
      expect(() =>
        DocsDiscrepancy.create(VALID_PATH, '', VALID_SEVERITY, VALID_CLAIM, VALID_ACTUAL),
      ).toThrow('Category must be a non-empty string');
    });

    it('should throw if pathFinding is invalid', () => {
      expect(() =>
        DocsDiscrepancy.create(
          {} as unknown as PathFinding,
          VALID_CATEGORY,
          VALID_SEVERITY,
          VALID_CLAIM,
          VALID_ACTUAL,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if severity is invalid', () => {
      expect(() =>
        DocsDiscrepancy.create(
          VALID_PATH,
          VALID_CATEGORY,
          {} as unknown as SeverityFinding,
          VALID_CLAIM,
          VALID_ACTUAL,
        ),
      ).toThrow('Invalid SeverityFinding');
    });

    it('should throw if docsClaim is invalid', () => {
      expect(() =>
        DocsDiscrepancy.create(
          VALID_PATH,
          VALID_CATEGORY,
          VALID_SEVERITY,
          {} as unknown as DescriptionFinding,
          VALID_ACTUAL,
        ),
      ).toThrow('Invalid claim');
    });

    it('should throw if actualFinding is invalid', () => {
      expect(() =>
        DocsDiscrepancy.create(
          VALID_PATH,
          VALID_CATEGORY,
          VALID_SEVERITY,
          VALID_CLAIM,
          {} as unknown as DescriptionFinding,
        ),
      ).toThrow('Invalid finding');
    });

    it('should return false for different objects', () => {
      const d1 = DocsDiscrepancy.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_SEVERITY,
        VALID_CLAIM,
        VALID_ACTUAL,
      );

      const d2 = DocsDiscrepancy.create(
        VALID_PATH,
        'different_category',
        VALID_SEVERITY,
        VALID_CLAIM,
        VALID_ACTUAL,
      );

      expect(d1.equals(d2)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const discrepancy = DocsDiscrepancy.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_SEVERITY,
        VALID_CLAIM,
        VALID_ACTUAL,
      );

      expect(() => discrepancy.equals(null)).toThrow('Invalid argument');
    });
  });
});
