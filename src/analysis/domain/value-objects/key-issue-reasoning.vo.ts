import { DescriptionFinding } from './description-finding.vo';
import { IssueLocation } from './issue-location.vo';
import { PathFinding } from './path-finding.vo';
import { SeverityFinding } from './severity-finding.vo';

export class KeyIssueReasoning {
  private constructor(
    private readonly _file: PathFinding,
    private readonly _location: IssueLocation,
    private readonly _rule: string,
    private readonly _severity: SeverityFinding,
    private readonly _originalDescription: DescriptionFinding,
    private readonly _aiReasoning: DescriptionFinding,
    private readonly _suggestedResolution: DescriptionFinding,
  ) {}

  public static create(
    file: PathFinding,
    location: IssueLocation,
    rule: string,
    severity: SeverityFinding,
    originalDescription: DescriptionFinding,
    aiReasoning: DescriptionFinding,
    suggestedResolution: DescriptionFinding,
  ): KeyIssueReasoning {
    if (!rule.trim()) throw new Error('Rule cannot be empty');
    return new KeyIssueReasoning(
      file,
      location,
      rule,
      severity,
      originalDescription,
      aiReasoning,
      suggestedResolution,
    );
  }

  public get file(): PathFinding {
    return this._file;
  }
  public get location(): IssueLocation {
    return this._location;
  }
  public get rule(): string {
    return this._rule;
  }
  public get severity(): SeverityFinding {
    return this._severity;
  }
  public get originalDescription(): DescriptionFinding {
    return this._originalDescription;
  }
  public get aiReasoning(): DescriptionFinding {
    return this._aiReasoning;
  }
  public get suggestedResolution(): DescriptionFinding {
    return this._suggestedResolution;
  }
}
