export class GitCredentialModel {
  constructor(
    public readonly repositoryUrl: string,
    public readonly patPassword: string,
  ) {}
}
