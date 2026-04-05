export class StartAnalysisResponseDTO {
  private constructor(
    public readonly path: string | null,
    public readonly analysisId: string | null,
    public readonly errorMessage?: string,
  ) {}

  public static success(path: string, id: string): StartAnalysisResponseDTO {
    return new StartAnalysisResponseDTO(path, id);
  }

  public static failure(error: string): StartAnalysisResponseDTO {
    return new StartAnalysisResponseDTO(null, null, error);
  }
}
