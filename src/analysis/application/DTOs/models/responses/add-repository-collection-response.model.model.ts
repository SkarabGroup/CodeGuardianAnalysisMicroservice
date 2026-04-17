export class AddRepositoryCollectionResponse {
  constructor(
    public readonly added: boolean,
    public readonly error?: string,
  ) {}

  public static success(): AddRepositoryCollectionResponse {
    return new AddRepositoryCollectionResponse(true);
  }

  public static failure(err: string): AddRepositoryCollectionResponse {
    return new AddRepositoryCollectionResponse(false, err);
  }
}
