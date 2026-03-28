export class StartAnalysisCommand {
  constructor(
    public readonly userId: string,
    public readonly repositoryUrl: string,
    public readonly branch: string = 'main',
    public readonly commitHash: string | null,
    public readonly patPassword: string | null,
  ) {}
}
