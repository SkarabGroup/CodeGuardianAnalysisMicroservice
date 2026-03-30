export class GitAccessRequestModel {
  constructor(
    public readonly repositoryUrl: string,
    public readonly patPassword: string,
  ) {}
}
