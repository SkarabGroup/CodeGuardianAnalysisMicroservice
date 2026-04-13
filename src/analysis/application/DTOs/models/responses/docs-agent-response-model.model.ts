export class DocsAgentResponse {
  constructor(
    public readonly isSuccess: boolean,
    public readonly apiViolations: {
      file: string;
      rule: string;
      severity: string;
      message: string;
    }[],
    public readonly docsDiscrepancies: {
      path: string;
      category: string;
      severity: string;
      docsClaim: string;
      actualFinding: string;
    }[],
    public readonly missingFiles: {
      referencedPath: string;
      referencedIn: string;
      status: string;
      description: string;
    }[],
    public readonly dependencyAudit: {
      readmeDefined: { name: string; versionClaimed: string | null }[];
      configDefined: { name: string; versionPinned: string | null; sourceFile: string }[];
      missingInConfig: { name: string; sourceFile: string; severity: string }[];
      undocumentedInReadme: { name: string; foundIn: string }[];
      versionMismatches: {
        name: string;
        readmeVersion: string;
        configVersion: string;
        sourceFile: string;
      }[];
    } | null,
    public readonly errorMessage?: string,
  ) {}

  public static success(
    apiViolations: DocsAgentResponse['apiViolations'],
    docsDiscrepancies: DocsAgentResponse['docsDiscrepancies'],
    missingFiles: DocsAgentResponse['missingFiles'],
    dependencyAudit: DocsAgentResponse['dependencyAudit'],
  ): DocsAgentResponse {
    return new DocsAgentResponse(
      true,
      apiViolations,
      docsDiscrepancies,
      missingFiles,
      dependencyAudit,
    );
  }

  public static failure(message: string): DocsAgentResponse {
    return new DocsAgentResponse(false, [], [], [], null, message);
  }
}