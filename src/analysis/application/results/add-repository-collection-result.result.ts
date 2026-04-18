export class AddRepositoryCollectionResult {
  private constructor(
    public readonly added: boolean,
    public readonly message?: string,
  ) {}

  public static success(): AddRepositoryCollectionResult {
    return new AddRepositoryCollectionResult(true);
  }

  public static failure(err: string): AddRepositoryCollectionResult {
    return new AddRepositoryCollectionResult(false, err);
  }
}
