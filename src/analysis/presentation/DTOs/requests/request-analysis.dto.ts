export class StartAnalysisRequestDTO {
  constructor(
    public readonly repoUrl: string,
    public readonly password: string | undefined,
    public readonly branch: string | undefined,
    public readonly commit: string | undefined,
    public readonly requestedCode: boolean,
  ) {}
}
