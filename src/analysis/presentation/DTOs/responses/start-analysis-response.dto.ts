export class StartAnalysisResponseDTO {
  private constructor(
    public readonly user: string | undefined,
    public readonly id: string | undefined,
    public readonly url: string | undefined,
    public readonly branch: string | undefined,
    public readonly commit: string | undefined,
    public readonly errorMessage: string,
  ) {}

  public static success(
    user: string | undefined,
    id: string | undefined,
    url: string | undefined,
    branch: string | undefined,
    commit: string | undefined,
  ): StartAnalysisResponseDTO {
    return new StartAnalysisResponseDTO(
      user,
      id,
      url,
      branch,
      commit,
      'Analysis Started Successfully',
    );
  }

  public static failure(error: string): StartAnalysisResponseDTO {
    return new StartAnalysisResponseDTO(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      error,
    );
  }
}
