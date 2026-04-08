export class DeletePatResponseDTO {
  private constructor(
    readonly removed: boolean,
    readonly error?: string,
  ) {}

  public static success() {
    return new DeletePatResponseDTO(true);
  }

  public static failure(error: string) {
    return new DeletePatResponseDTO(false, error);
  }
}
