import { DocumentationFinding } from '../../../../src/analysis/domain/value-objects/docs/documentation-finding.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { ErrorFinding } from '../../../../src/analysis/domain/value-objects/error-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';

describe('DocumentationFinding (Value Object)', () => {
  const VALID_PATH = PathFinding.create('src/index.ts');
  const VALID_DESC = DescriptionFinding.create('Missing documentation');
  const VALID_SEVERITY = SeverityFinding.create('MEDIUM');
  const VALID_ERROR = ErrorFinding.create(10, VALID_DESC, VALID_SEVERITY);
  const VALID_DOC_PATH = ['info', 'contact'];
  const VALID_RULE = 'AUTH-001';

  describe('Success cases', () => {
    it('should create a valid DocumentationFinding instance', () => {
      const df = DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, VALID_RULE);

      expect(df).toBeDefined();
    });

    it('should return correct values from getters', () => {
      const df = DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, VALID_RULE);

      expect(df.getPathFinding()).toBe(VALID_PATH);
      expect(df.getErrorFinding()).toBe(VALID_ERROR);
      expect(df.getRuleCode()).toBe(VALID_RULE);
      expect(df.getDocumentPath()).toEqual(VALID_DOC_PATH);
    });

    it('should trim string fields and document path elements when creating an instance', () => {
      const df = DocumentationFinding.create(
        VALID_PATH,
        VALID_ERROR,
        ['  info  ', '  contact  '],
        '  AUTH-001  ',
      );

      expect(df.getRuleCode()).toBe('AUTH-001');
      expect(df.getDocumentPath()).toEqual(['info', 'contact']);
    });

    it('should protect internal documentPath array (immutability)', () => {
      const df = DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, VALID_RULE);

      const path = df.getDocumentPath();
      path.push('hacker');

      expect(df.getDocumentPath()).toEqual(VALID_DOC_PATH);
    });
  });

  describe('Equality check', () => {
    it('should return true for identical objects', () => {
      const a = DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, VALID_RULE);
      const b = DocumentationFinding.create(
        PathFinding.create('src/index.ts'),
        ErrorFinding.create(
          10,
          DescriptionFinding.create('Missing documentation'),
          SeverityFinding.create('MEDIUM'),
        ),
        ['info', 'contact'],
        'AUTH-001',
      );

      expect(a.equals(b)).toBe(true);
    });

    it('should return false if documentPath order is different', () => {
      const a = DocumentationFinding.create(
        VALID_PATH,
        VALID_ERROR,
        ['info', 'contact'],
        VALID_RULE,
      );
      const b = DocumentationFinding.create(
        VALID_PATH,
        VALID_ERROR,
        ['contact', 'info'],
        VALID_RULE,
      );

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different rule codes', () => {
      const a = DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, 'RULE-1');
      const b = DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, 'RULE-2');

      expect(a.equals(b)).toBe(false);
    });

    it('should throw error if equals is called with invalid argument', () => {
      const df = DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, VALID_RULE);

      expect(() => df.equals(null)).toThrow('Invalid argument');
      expect(() => df.equals({})).toThrow('Invalid argument');
    });
  });

  describe('Failure cases', () => {
    it('should throw if pathFinding is invalid', () => {
      expect(() =>
        DocumentationFinding.create(
          {} as unknown as PathFinding,
          VALID_ERROR,
          VALID_DOC_PATH,
          VALID_RULE,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if errorFinding is invalid', () => {
      expect(() =>
        DocumentationFinding.create(
          VALID_PATH,
          {} as unknown as ErrorFinding,
          VALID_DOC_PATH,
          VALID_RULE,
        ),
      ).toThrow('Invalid ErrorFinding');
    });

    it('should throw if documentPath is not an array', () => {
      expect(() =>
        DocumentationFinding.create(
          VALID_PATH,
          VALID_ERROR,
          null as unknown as string[],
          VALID_RULE,
        ),
      ).toThrow('Document path must be an array');
    });

    it('should throw if any part of the document path is not a string or empty', () => {
      expect(() =>
        DocumentationFinding.create(VALID_PATH, VALID_ERROR, ['info', ' '], VALID_RULE),
      ).toThrow('The parts of the document path must be a non-empty string');

      expect(() =>
        DocumentationFinding.create(VALID_PATH, VALID_ERROR, ['info', 123], VALID_RULE),
      ).toThrow('The parts of the document path must be a non-empty string');
    });

    it('should throw if rule code is empty or not a string', () => {
      expect(() =>
        DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, '  '),
      ).toThrow('Rule code must be a non-empty string');

      expect(() =>
        DocumentationFinding.create(VALID_PATH, VALID_ERROR, VALID_DOC_PATH, 123),
      ).toThrow('Rule code must be a non-empty string');
    });

    it('should return false when documentPath arrays have different lengths', () => {
      const a = DocumentationFinding.create(VALID_PATH, VALID_ERROR, ['info'], VALID_RULE);
      const b = DocumentationFinding.create(
        VALID_PATH,
        VALID_ERROR,
        ['info', 'contact'],
        VALID_RULE,
      );

      expect(a.equals(b)).toBe(false);
    });
  });
});
