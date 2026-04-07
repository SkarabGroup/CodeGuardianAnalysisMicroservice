export class PostPatResponseDTO {
  private constructor(
    readonly added: boolean,
    readonly error?: string,
  ) {}

  public static success() {
    return new PostPatResponseDTO(true);
  }

  public static failure(error: string) {
    return new PostPatResponseDTO(false, error);
  }
}
