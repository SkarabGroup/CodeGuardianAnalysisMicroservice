export class DeleteRepositoryCollectionResult {
  private constructor(
    public readonly deleted: boolean,
    public readonly message?: string,
  ) {}

  public static success(): DeleteRepositoryCollectionResult {
    return new DeleteRepositoryCollectionResult(true);
  }

  public static failure(err: string): DeleteRepositoryCollectionResult {
    return new DeleteRepositoryCollectionResult(false, err);
  }
}
