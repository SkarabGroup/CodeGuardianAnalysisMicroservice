export class CloneRepoRequest {
  constructor(
    public readonly repoUrl: string,
    public readonly analysisId: string,
    public readonly patToken: string | null,
    public readonly branch: string | null,
    public readonly commit: string | null,
  ) {}
}
