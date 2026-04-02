export class GetGitCredentialResponse {
  constructor(
    public readonly patToken: string | null,
    public readonly isAuthorized: boolean,
    public readonly errorMessage?: string,
  ) {}
}
