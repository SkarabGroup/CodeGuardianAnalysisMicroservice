export class StartAnalysisResponseDTO {
  private constructor(
    public readonly id: string | undefined,
    public readonly user: string | undefined,
    public readonly url: string | undefined,
    public readonly branch: string | undefined,
    public readonly commit: string | undefined,
    public readonly errorMessage: string,
  ) {}

  public static success(
    id: string | undefined,
    user: string | undefined,
    url: string | undefined,
    branch: string | undefined,
    commit: string | undefined,
  ): StartAnalysisResponseDTO {
    return new StartAnalysisResponseDTO(
      id,
      user,
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
