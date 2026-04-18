export class DeleteRepositoryCollectionResponse {
  private constructor(
    public readonly deleted: boolean,
    public readonly message?: string,
  ) {}

  public static success() {
    return new DeleteRepositoryCollectionResponse(true);
  }

  public static failure(err: string) {
    return new DeleteRepositoryCollectionResponse(false, err);
  }
}
