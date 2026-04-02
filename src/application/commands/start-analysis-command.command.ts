export class StartAnalysisCommand {
  constructor(
    public readonly userId: string,
    public readonly repositoryUrl: string,
    public readonly patPassword?: string,
    public readonly branch?: string,
    public readonly commitHash?: string,
  ) {}
}
