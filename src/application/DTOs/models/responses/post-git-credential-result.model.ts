export class PostGitCredentialResponse {
  constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): PostGitCredentialResponse {
    return new PostGitCredentialResponse(true);
  }

  public static failure(message: string): PostGitCredentialResponse {
    return new PostGitCredentialResponse(false, message);
  }
}
