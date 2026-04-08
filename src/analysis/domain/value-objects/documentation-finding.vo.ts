import { ErrorFinding } from './error-finding.vo';
import { PathFinding } from './path-finding.vo';

export class DocumentationFinding {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _errorFinding: ErrorFinding,
    private readonly _ruleCode: string,
    private readonly _documentPath: string[],
  ) {}

  public equals(other: DocumentationFinding): boolean {
    if (!(other instanceof DocumentationFinding)) {
      throw new Error('Invalid argument');
    }
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._errorFinding.equals(other._errorFinding) &&
      this._ruleCode === other._ruleCode &&
      this.documentPathEqual(this._documentPath, other._documentPath)
    );
  }

  private documentPathEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((val, i) => val === b[i]);
  }

  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public getErrorFinding(): ErrorFinding {
    return this._errorFinding;
  }

  public getRuleCode(): string {
    return this._ruleCode;
  }

  public getDocumentPath(): string[] {
    return [...this._documentPath];
  }

  public static create(
    pathFinding: PathFinding,
    errorFinding: ErrorFinding,
    documentPath: string[],
    ruleCode: string,
  ): DocumentationFinding {
    if (!(pathFinding instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (!(errorFinding instanceof ErrorFinding)) {
      throw new Error('Invalid ErrorFinding');
    }

    if (!Array.isArray(documentPath)) {
      throw new Error('Document path must be an array');
    }

    const trimmedDocumentPath = documentPath.map((dp) => {
      if (typeof dp !== 'string' || !dp.trim()) {
        throw new Error('The parts of the document path must be a non-empty string');
      }
      return dp.trim();
    });

    if (typeof ruleCode !== 'string' || !ruleCode.trim()) {
      throw new Error('Rule code must be a non-empty string');
    }

    return new DocumentationFinding(
      pathFinding,
      errorFinding,
      ruleCode.trim(),
      trimmedDocumentPath,
    );
  }
}
