export class DeleteGitCredentialResponse {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  static success(): DeleteGitCredentialResponse {
    return new DeleteGitCredentialResponse(true);
  }

  static failure(message: string): DeleteGitCredentialResponse {
    return new DeleteGitCredentialResponse(false, message);
  }
}
