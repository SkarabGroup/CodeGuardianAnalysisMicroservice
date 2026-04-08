import { PathFinding } from './path-finding.vo';
import { ErrorFinding } from './error-finding.vo';
import { SupportedLanguages } from '../enums/supported-languages.enum';

export class StaticAnalysisFinding {
  private readonly _path: PathFinding;
  private readonly _errorCategory: string;
  private readonly _errorFinding: ErrorFinding;
  private readonly _analyzedLanguage: SupportedLanguages;

  private constructor(
    path: PathFinding,
    category: string,
    error: ErrorFinding,
    language: SupportedLanguages,
  ) {
    this.validate(language);
    this._path = path;
    this._errorCategory = category;
    this._errorFinding = error;
    this._analyzedLanguage = language;
  }

  public static create(
    path: PathFinding,
    category: string,
    error: ErrorFinding,
    language: string,
  ): StaticAnalysisFinding {
    if (!(path instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (typeof category !== 'string' || !category.trim()) {
      throw new Error('Category must be a non-empty string');
    }

    if (!(error instanceof ErrorFinding)) {
      throw new Error('Invalid ErrorFinding');
    }

    if (typeof language !== 'string') {
      throw new Error('Language must be a string');
    }

    const normalizedLanguage = language.trim().toUpperCase();

    if (!normalizedLanguage) {
      throw new Error('Language cannot be empty');
    }

    return new StaticAnalysisFinding(
      path,
      category.trim(),
      error,
      normalizedLanguage as SupportedLanguages,
    );
  }

  private validate(language: SupportedLanguages): void {
    if (!Object.values(SupportedLanguages).includes(language)) {
      throw new Error('Invalid analyzed language');
    }
  }

  public getPathFinding(): PathFinding {
    return this._path;
  }

  public getErrorCategory(): string {
    return this._errorCategory;
  }

  public getErrorFinding(): ErrorFinding {
    return this._errorFinding;
  }

  public getAnalyzedLanguage(): SupportedLanguages {
    return this._analyzedLanguage;
  }

  public equals(other: StaticAnalysisFinding): boolean {
    if (!(other instanceof StaticAnalysisFinding)) {
      throw new Error('Invalid argument');
    }

    return (
      this._path.equals(other._path) &&
      this._errorCategory === other._errorCategory &&
      this._errorFinding.equals(other._errorFinding) &&
      this._analyzedLanguage === other._analyzedLanguage
    );
  }
}
