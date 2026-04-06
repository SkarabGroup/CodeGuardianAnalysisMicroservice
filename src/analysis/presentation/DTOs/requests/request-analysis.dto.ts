export class StartAnalysisRequestDTO {
  constructor(
    public readonly repoUrl: string,
    public readonly password?: string
  ) {}
}
