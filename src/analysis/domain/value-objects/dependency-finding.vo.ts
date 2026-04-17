import { PathFinding } from './path-finding.vo';
import { SeverityFinding } from './severity-finding.vo';
import { DescriptionFinding } from './description-finding.vo';

export class DependencyFinding {
  private readonly _path: PathFinding;
  private readonly _packageName: string;
  private readonly _packageVersion: string;
  private readonly _vulnerabilityId: string;
  private readonly _severity: SeverityFinding;
  private readonly _description: DescriptionFinding;
  private readonly _remediation: DescriptionFinding;

  private constructor(
    path: PathFinding,
    packageName: string,
    packageVersion: string,
    vulnerabilityId: string,
    severity: SeverityFinding,
    description: DescriptionFinding,
    remediation: DescriptionFinding,
  ) {
    this.validate(vulnerabilityId);
    this._path = path;
    this._packageName = packageName;
    this._packageVersion = packageVersion;
    this._vulnerabilityId = vulnerabilityId;
    this._severity = severity;
    this._description = description;
    this._remediation = remediation;
  }

  public static create(
    path: PathFinding,
    packageName: string,
    packageVersion: string,
    vulnerabilityId: string,
    severity: SeverityFinding,
    description: DescriptionFinding,
    remediation: DescriptionFinding
  ): DependencyFinding {
    if (!(path instanceof PathFinding)) {
      throw new Error('Invalid PathFinding');
    }

    if (typeof packageName !== 'string' || !packageName.trim()) {
      throw new Error('Package name must be a non-empty string');
    }

    if (typeof packageVersion !== 'string' || !packageVersion.trim()) {
      throw new Error('Package version must be a non-empty string');
    }

    if (typeof vulnerabilityId !== 'string' || !vulnerabilityId.trim()) {
      throw new Error('Vulnerability ID must be a non-empty string');
    }

    if (!(severity instanceof SeverityFinding)) {
      throw new Error('Invalid SeverityFinding');
    }

    if (!(description instanceof DescriptionFinding)) {
      throw new Error('Invalid DescriptionFinding');
    }

    if (!(remediation instanceof DescriptionFinding)) {
      throw new Error('Invalid DescriptionFinding');
    }

    return new DependencyFinding(
      path,
      packageName.trim(),
      packageVersion.trim(),
      vulnerabilityId.trim(),
      severity,
      description,
      remediation
    );
  }

  private validate(vulnerabilityId: string): void {
    const vulnerabilityFormat = /^[A-Za-z0-9-]+$/;

    if (!vulnerabilityFormat.test(vulnerabilityId)) {
      throw new Error('Invalid vulnerability ID format');
    }
  }

  public getPathFinding(): PathFinding {
    return this._path;
  }

  public getPackageName(): string {
    return this._packageName;
  }

  public getPackageVersion(): string {
    return this._packageVersion;
  }

  public getVulnerabilityId(): string {
    return this._vulnerabilityId;
  }

  public getSeverityFinding(): SeverityFinding {
    return this._severity;
  }

  public getDescriptionFinding(): DescriptionFinding {
    return this._description;
  }

  public getRemediation(): DescriptionFinding {
    return this._remediation;
  }

  public equals(other: DependencyFinding): boolean {
    if (!(other instanceof DependencyFinding)) {
      throw new Error('Invalid argument');
    }

    return (
      this._path.equals(other._path) &&
      this._packageName === other._packageName &&
      this._packageVersion === other._packageVersion &&
      this._vulnerabilityId === other._vulnerabilityId &&
      this._severity.equals(other._severity) &&
      this._description.equals(other._description) &&
      this._remediation.equals(other._remediation)
    );
  }
}
