import { PathFinding } from './path-finding.vo';
import { PositionFinding } from './position-finding.vo';
import { SeverityFinding } from './severity-finding.vo';
import { DescriptionFinding } from './description-finding.vo';

export class StaticAnalysisIssue {
  private constructor(
    private readonly _pathFinding: PathFinding,
    private readonly _positionFinding: PositionFinding,
    private readonly _rule: string,
    private readonly _severityFinding: SeverityFinding,
    private readonly _originalDescription: DescriptionFinding,
    private readonly _aiReasoning: DescriptionFinding,
    private readonly _suggestedResolution: DescriptionFinding,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this._rule.trim()) throw new Error('Rule must be a non-empty string');
  }

  public static create(
    path: PathFinding,
    position: PositionFinding,
    rule: string,
    severity: SeverityFinding,
    originalDescription: DescriptionFinding,
    aiReasoning: DescriptionFinding,
    suggestedResolution: DescriptionFinding,
  ): StaticAnalysisIssue {
    if (!(path instanceof PathFinding)) throw new Error('Invalid PathFinding');
    if (!(position instanceof PositionFinding)) throw new Error('Invalid Position');
    if (typeof rule !== 'string') throw new Error('Rule must be a string');
    if (!(severity instanceof SeverityFinding)) throw new Error('Invalid SeverityFinding');
    if (!(originalDescription instanceof DescriptionFinding)) throw new Error('Invalid DescriptionFinding');
    if (!(aiReasoning instanceof DescriptionFinding)) throw new Error('Invalid DescriptionFinding');
    if (!(suggestedResolution instanceof DescriptionFinding)) throw new Error('Invalid DescriptionFinding');

    return new StaticAnalysisIssue(
      path,
      position,
      rule.trim(),
      severity,
      originalDescription,
      aiReasoning,
      suggestedResolution,
    );
  }

  public getPathFinding(): PathFinding { return this._pathFinding; }
  public getPosition(): PositionFinding { return this._positionFinding; }
  public getRule(): string { return this._rule; }
  public getSeverityFinding(): SeverityFinding { return this._severityFinding; }
  public getOriginalDescription(): DescriptionFinding { return this._originalDescription; }
  public getAiReasoning(): DescriptionFinding { return this._aiReasoning; }
  public getSuggestedResolution(): DescriptionFinding { return this._suggestedResolution; }

  public equals(other: StaticAnalysisIssue): boolean {
    if (!(other instanceof StaticAnalysisIssue)) throw new Error('Invalid argument');
    return (
      this._pathFinding.equals(other._pathFinding) &&
      this._positionFinding.equals(other._positionFinding) &&
      this._rule === other._rule &&
      this._severityFinding.equals(other._severityFinding)
    );
  }
}