export class PostGitCredentialRequest {
  constructor(
    public readonly repoUrl: string,
    public readonly password: string,
    public readonly pat: string,
  ) {}
}
