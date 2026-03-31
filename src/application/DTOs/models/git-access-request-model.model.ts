export class GitRequestModel {
  constructor(
    public readonly repositoryUrl: string,
    public readonly branchName: string,
    public readonly commitHash: string | null,
    public readonly personalAccessToken: string | null,
  ) {}
}
