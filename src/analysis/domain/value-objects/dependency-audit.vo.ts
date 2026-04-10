import { ReadmeDependency } from './readme-dependency.vo';
import { ConfigDependency } from './config-dependency.vo';
import { MissingInConfigDependency } from './missing-in-config-dependency.vo';
import { UndocumentedDependency } from './undocumented-dependency.vo';
import { VersionMismatchDependency } from './version-mismatch-dependency.vo';

export type DependencyAuditProps = {
  readmeDefined?: ReadmeDependency[];
  configDefined?: ConfigDependency[];
  missingInConfig?: MissingInConfigDependency[];
  undocumentedInReadme?: UndocumentedDependency[];
  versionMismatches?: VersionMismatchDependency[];
};

export class DependencyAudit {
  private constructor(
    private readonly _readmeDefined: ReadmeDependency[],
    private readonly _configDefined: ConfigDependency[],
    private readonly _missingInConfig: MissingInConfigDependency[],
    private readonly _undocumentedInReadme: UndocumentedDependency[],
    private readonly _versionMismatches: VersionMismatchDependency[],
  ) {}

  public equals(other: DependencyAudit): boolean {
    if (!(other instanceof DependencyAudit)) {
      throw new Error('Invalid argument');
    }
    return (
      this.arrayEquals(this._readmeDefined, other._readmeDefined) &&
      this.arrayEquals(this._configDefined, other._configDefined) &&
      this.arrayEquals(this._missingInConfig, other._missingInConfig) &&
      this.arrayEquals(this._undocumentedInReadme, other._undocumentedInReadme) &&
      this.arrayEquals(this._versionMismatches, other._versionMismatches)
    );
  }

  private arrayEquals<T extends { getName(): string; equals(other: T): boolean }>(
    a: T[],
    b: T[],
  ): boolean {
    if (a.length !== b.length) return false;

    const sortFn = (x: T, y: T) => x.getName().localeCompare(y.getName());

    const sortedA = [...a].sort(sortFn);
    const sortedB = [...b].sort(sortFn);

    return sortedA.every((val, i) => val.equals(sortedB[i]));
  }

  public getReadmeDefined(): ReadmeDependency[] {
    return [...this._readmeDefined];
  }

  public getConfigDefined(): ConfigDependency[] {
    return [...this._configDefined];
  }

  public getMissingInConfig(): MissingInConfigDependency[] {
    return [...this._missingInConfig];
  }

  public getUndocumentedInReadme(): UndocumentedDependency[] {
    return [...this._undocumentedInReadme];
  }

  public getVersionMismatches(): VersionMismatchDependency[] {
    return [...this._versionMismatches];
  }

  public static create(props: DependencyAuditProps = {}): DependencyAudit {
    const readmeDefined = props.readmeDefined || [];
    const configDefined = props.configDefined || [];
    const missingInConfig = props.missingInConfig || [];
    const undocumentedInReadme = props.undocumentedInReadme || [];
    const versionMismatches = props.versionMismatches || [];

    if (!Array.isArray(readmeDefined)) throw new Error('readmeDefined must be an array');
    readmeDefined.forEach((item) => {
      if (!(item instanceof ReadmeDependency)) throw new Error('Invalid ReadmeDependency');
    });

    if (!Array.isArray(configDefined)) throw new Error('configDefined must be an array');
    configDefined.forEach((item) => {
      if (!(item instanceof ConfigDependency)) throw new Error('Invalid ConfigDependency');
    });

    if (!Array.isArray(missingInConfig)) throw new Error('missingInConfig must be an array');
    missingInConfig.forEach((item) => {
      if (!(item instanceof MissingInConfigDependency))
        throw new Error('Invalid MissingInConfigDependency');
    });

    if (!Array.isArray(undocumentedInReadme))
      throw new Error('undocumentedInReadme must be an array');
    undocumentedInReadme.forEach((item) => {
      if (!(item instanceof UndocumentedDependency))
        throw new Error('Invalid UndocumentedDependency');
    });

    if (!Array.isArray(versionMismatches)) throw new Error('versionMismatches must be an array');
    versionMismatches.forEach((item) => {
      if (!(item instanceof VersionMismatchDependency))
        throw new Error('Invalid VersionMismatchDependency');
    });

    return new DependencyAudit(
      readmeDefined,
      configDefined,
      missingInConfig,
      undocumentedInReadme,
      versionMismatches,
    );
  }
}
