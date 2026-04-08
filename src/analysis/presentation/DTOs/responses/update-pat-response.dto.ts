export class UpdatePatResponseDTO {
  private constructor(
    readonly updated: boolean,
    readonly error?: string,
  ) {}

  public static success() {
    return new UpdatePatResponseDTO(true);
  }

  public static failure(error: string) {
    return new UpdatePatResponseDTO(false, error);
  }
}
