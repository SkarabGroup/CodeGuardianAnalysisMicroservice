import { StaticAnalysisFinding } from '../../../../src/analysis/domain/value-objects/static-analysis-finding.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { ErrorFinding } from '../../../../src/analysis/domain/value-objects/error-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { SupportedLanguages } from '../../../../src/analysis/domain/enums/supported-languages.enum';

describe('StaticAnalysisFinding (Value Object)', () => {
  const VALID_PATH = PathFinding.create('src/app.ts');
  const VALID_DESC = DescriptionFinding.create('Variable never used');
  const VALID_SEVERITY = SeverityFinding.create('LOW');

  const VALID_ERROR = ErrorFinding.create(15, VALID_DESC, VALID_SEVERITY);

  const VALID_CATEGORY = 'Code Quality';
  const VALID_LANGUAGE_INPUT = 'typescript';
  const EXPECTED_LANGUAGE = SupportedLanguages.TYPESCRIPT;

  describe('Success cases', () => {
    it('should create a valid StaticAnalysisFinding instance', () => {
      const staticAnalysis = StaticAnalysisFinding.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_ERROR,
        VALID_LANGUAGE_INPUT,
      );

      expect(staticAnalysis).toBeDefined();
      expect(staticAnalysis.getPathFinding()).toBe(VALID_PATH);
      expect(staticAnalysis.getErrorCategory()).toBe(VALID_CATEGORY);
      expect(staticAnalysis.getErrorFinding()).toBe(VALID_ERROR);
      expect(staticAnalysis.getAnalyzedLanguage()).toBe(EXPECTED_LANGUAGE);
    });

    it('should normalize category (trim) and language (trim + uppercase)', () => {
      const finding = StaticAnalysisFinding.create(
        VALID_PATH,
        '  Security  ',
        VALID_ERROR,
        '  javascript  ',
      );

      expect(finding.getErrorCategory()).toBe('Security');
      expect(finding.getAnalyzedLanguage()).toBe(SupportedLanguages.JAVASCRIPT);
    });

    it('should return true for equal objects', () => {
      const f1 = StaticAnalysisFinding.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_ERROR,
        'TYPESCRIPT',
      );
      const f2 = StaticAnalysisFinding.create(
        PathFinding.create('src/app.ts'),
        VALID_CATEGORY,
        ErrorFinding.create(
          15,
          DescriptionFinding.create('Variable never used'),
          SeverityFinding.create('LOW'),
        ),
        'typescript',
      );

      expect(f1.equals(f2)).toBe(true);
    });
  });

  describe('Failure cases', () => {
    it('should throw if path is not a PathFinding instance', () => {
      expect(() =>
        StaticAnalysisFinding.create(
          {} as unknown as PathFinding,
          VALID_CATEGORY,
          VALID_ERROR,
          VALID_LANGUAGE_INPUT,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if category is empty string', () => {
      expect(() =>
        StaticAnalysisFinding.create(VALID_PATH, ' ', VALID_ERROR, VALID_LANGUAGE_INPUT),
      ).toThrow('Category must be a non-empty string');
    });

    it('should throw if error is not an ErrorFinding instance', () => {
      expect(() =>
        StaticAnalysisFinding.create(
          VALID_PATH,
          VALID_CATEGORY,
          {} as unknown as ErrorFinding,
          VALID_LANGUAGE_INPUT,
        ),
      ).toThrow('Invalid ErrorFinding');
    });

    it('should throw if language string is empty', () => {
      expect(() =>
        StaticAnalysisFinding.create(VALID_PATH, VALID_CATEGORY, VALID_ERROR, '  '),
      ).toThrow('Language cannot be empty');
    });

    it('should throw if language is not a string', () => {
      expect(() =>
        StaticAnalysisFinding.create(
          VALID_PATH,
          VALID_CATEGORY,
          VALID_ERROR,
          123 as unknown as string,
        ),
      ).toThrow('Language must be a string');
    });

    it('should throw if language is not supported by the enum', () => {
      expect(() =>
        StaticAnalysisFinding.create(VALID_PATH, VALID_CATEGORY, VALID_ERROR, 'CSHARP'),
      ).toThrow('Invalid analyzed language');
    });

    it('should return false when comparing with a different object', () => {
      const f1 = StaticAnalysisFinding.create(
        VALID_PATH,
        VALID_CATEGORY,
        VALID_ERROR,
        'TYPESCRIPT',
      );
      const f2 = StaticAnalysisFinding.create(
        VALID_PATH,
        'Different Category',
        VALID_ERROR,
        'TYPESCRIPT',
      );

      expect(f1.equals(f2)).toBe(false);
    });

    it('should throw when comparing with null or invalid type', () => {
      const f = StaticAnalysisFinding.create(VALID_PATH, VALID_CATEGORY, VALID_ERROR, 'TYPESCRIPT');

      expect(() => f.equals(null)).toThrow('Invalid argument');
      expect(() => f.equals({})).toThrow('Invalid argument');
    });
  });
});
