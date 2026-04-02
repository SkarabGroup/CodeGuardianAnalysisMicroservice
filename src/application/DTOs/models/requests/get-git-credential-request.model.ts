export class GetGitCredentialRequest {
  constructor(
    public readonly repoUrl: string,
    public readonly password: string,
  ) {}
}
