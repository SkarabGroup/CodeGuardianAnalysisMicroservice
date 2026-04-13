import { DescriptionFinding } from './description-finding.vo';
import { PathFinding } from './path-finding.vo';
import { SeverityFinding } from './severity-finding.vo';

export class DocsDiscrepancy {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _discrepancyCategory: string,
    private readonly _severity: SeverityFinding,
    private readonly _docsClaim: DescriptionFinding,
    private readonly _actualFinding: DescriptionFinding,
  ) {}

  public equals(other: DocsDiscrepancy): boolean {
    if (!(other instanceof DocsDiscrepancy)) {
      throw new Error('Invalid argument');
    }
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._severity.equals(other._severity) &&
      this._discrepancyCategory === other._discrepancyCategory &&
      this._docsClaim.equals(other._docsClaim) &&
      this._actualFinding.equals(other._actualFinding)
    );
  }

  public getPathFinding(): PathFinding {
    return this._pathFinding;
  }

  public getDiscrepancyCategory(): string {
    return this._discrepancyCategory;
  }

  public getSeverityFinding(): SeverityFinding {
    return this._severity;
  }

  public getDocsClaim(): DescriptionFinding {
    return this._docsClaim;
  }

  public getActualFinding(): DescriptionFinding {
    return this._actualFinding;
  }

  public static create(
    path: PathFinding,
    category: string,
    severity: SeverityFinding,
    docsClaim: DescriptionFinding,
    actualFinding: DescriptionFinding,
  ): DocsDiscrepancy {
    if (!(path instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (typeof category !== 'string' || !category.trim()) {
      throw new Error('Category must be a non-empty string');
    }

    if (!(severity instanceof SeverityFinding)) {
      throw new Error('Invalid SeverityFinding');
    }

    if (!(docsClaim instanceof DescriptionFinding)) {
      throw new Error('Invalid claim');
    }

    if (!(actualFinding instanceof DescriptionFinding)) {
      throw new Error('Invalid finding');
    }

    return new DocsDiscrepancy(path, category.trim(), severity, docsClaim, actualFinding);
  }
}
