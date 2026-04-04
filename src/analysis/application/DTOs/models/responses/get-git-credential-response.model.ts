export class GetGitCredentialResponse {
  constructor(
    public readonly patToken: string | null,
    public readonly isAuthorized: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(pat: string) {
    return new GetGitCredentialResponse(pat, true);
  }

  public static failure(error: string) {
    return new GetGitCredentialResponse(null, false, error);
  }
}
