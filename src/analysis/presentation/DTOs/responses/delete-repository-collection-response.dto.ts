export class DeleteRepositoryCollectionResponseDTO {
  private constructor(
    public readonly deleted: boolean,
    public readonly message?: string,
  ) {}

  public static success() {
    return new DeleteRepositoryCollectionResponseDTO(true);
  }

  public static failure(err: string) {
    return new DeleteRepositoryCollectionResponseDTO(false, err);
  }
}
