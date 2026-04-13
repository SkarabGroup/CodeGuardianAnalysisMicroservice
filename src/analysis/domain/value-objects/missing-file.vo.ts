import { DescriptionFinding } from './description-finding.vo';
import { PathFinding } from './path-finding.vo';
import { StatusMissing } from '../enums/status-missing.enum';

export class MissingFile {
  private constructor(
    private readonly _referencedPath: PathFinding,
    private readonly _referencedIn: PathFinding,
    private readonly _descriptionFinding: DescriptionFinding,
    private readonly _statusMissing: StatusMissing,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Object.values(StatusMissing).includes(this._statusMissing)) {
      throw new Error('Invalid status missing');
    }
  }

  public equals(other: MissingFile): boolean {
    if (!(other instanceof MissingFile)) {
      throw new Error('Invalid argument');
    }
    return (
      this._referencedPath.equals(other._referencedPath) &&
      this._referencedIn.equals(other._referencedIn) &&
      this._statusMissing === other._statusMissing &&
      this._descriptionFinding.equals(other._descriptionFinding)
    );
  }

  public getReferencedPath(): PathFinding {
    return this._referencedPath;
  }

  public getReferencedIn(): PathFinding {
    return this._referencedIn;
  }

  public getStatusMissing(): StatusMissing {
    return this._statusMissing;
  }

  public getDescriptionFinding(): DescriptionFinding {
    return this._descriptionFinding;
  }

  public static create(
    referencedPath: PathFinding,
    referencedIn: PathFinding,
    status: StatusMissing,
    description: DescriptionFinding,
  ): MissingFile {
    if (!(referencedPath instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (!(referencedIn instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    const normalizedStatus = status.trim().toUpperCase();

    if (!(description instanceof DescriptionFinding)) {
      throw new Error('Invalid DescriptionFinding');
    }

    return new MissingFile(
      referencedPath,
      referencedIn,
      description,
      normalizedStatus as StatusMissing,
    );
  }
}
