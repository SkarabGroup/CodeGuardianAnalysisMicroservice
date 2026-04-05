export class UpdateGitCredentialPatResponse {
  constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage: string,
  ) {}
  static success(): UpdateGitCredentialPatResponse {
    return new UpdateGitCredentialPatResponse(true, 'Token updated successfully');
  }

  static failure(message: string): UpdateGitCredentialPatResponse {
    return new UpdateGitCredentialPatResponse(false, message);
  }
}
