export class RepositoryCollectionItemDTO {
  constructor(
    public readonly url: string,
    public readonly name: string,
    public readonly description?: string,
  ) {}
}

export class GetAllRepositoryCollectionsResponseDTO {
  private constructor(
    public readonly success: boolean,
    public readonly collections?: RepositoryCollectionItemDTO[],
    public readonly message?: string,
  ) {}

  public static success(
    collections: RepositoryCollectionItemDTO[],
  ): GetAllRepositoryCollectionsResponseDTO {
    return new GetAllRepositoryCollectionsResponseDTO(true, collections);
  }

  public static failure(err: string): GetAllRepositoryCollectionsResponseDTO {
    return new GetAllRepositoryCollectionsResponseDTO(false, undefined, err);
  }
}
