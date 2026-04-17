import { DescriptionFinding } from "./description-finding.vo";

export class ToolError {
  private readonly _toolName: string;
  private readonly _description: DescriptionFinding;

  private constructor(
    tool: string,
    description: DescriptionFinding,
  ) {
    this._toolName = tool;
    this._description = description;
  }

  public static create(tool: string, description: DescriptionFinding): ToolError {
    if (typeof tool !== 'string' || !tool.trim()) {
      throw new Error('Tool name must be a non-empty string');
    }
    if (!(description instanceof DescriptionFinding)) {
      throw new Error('Invalid DescriptionFinding');
    }
    return new ToolError(tool.trim(), description);
  }

  public getToolName(): string {
    return this._toolName;
  }

  public getDescriptionFinding(): DescriptionFinding {
    return this._description;
  }

  public equals(other: ToolError): boolean {
    if (!(other instanceof ToolError)) {
      throw new Error('Invalid argument');
    }

    return (
      this._toolName === other._toolName &&
      this._description.equals(other._description)
    );
  }
}