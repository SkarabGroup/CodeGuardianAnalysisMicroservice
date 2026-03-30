export class GitAccessRequestModel {
  constructor(
    public readonly repositoryUrl: string,
    public readonly branchName: string,
    public readonly commitHash: string,
    public readonly personalAccessToken: string,
  ) {}
}
