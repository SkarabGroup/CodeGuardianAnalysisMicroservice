export class AddRepositoryCollectionResponseDTO {
  private constructor(
    public readonly success: boolean,
    public readonly message?: string,
  ) {}

  public static success() {
    return new AddRepositoryCollectionResponseDTO(true);
  }

  public static failure(err: string) {
    return new AddRepositoryCollectionResponseDTO(false, err);
  }
}
