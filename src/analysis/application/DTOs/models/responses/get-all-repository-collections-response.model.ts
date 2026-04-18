export interface CollectionDataResponse {
  url: string;
  name: string;
  description: string | null;
  analyses: string[];
}

export class GetAllRepositoryCollectionsResponse {
  constructor(
    public readonly success: boolean,
    public readonly data: CollectionDataResponse[],
    public readonly message?: string,
  ) {}

  public static success(data: CollectionDataResponse[]): GetAllRepositoryCollectionsResponse {
    return new GetAllRepositoryCollectionsResponse(true, data);
  }

  public static failure(message: string): GetAllRepositoryCollectionsResponse {
    return new GetAllRepositoryCollectionsResponse(false, [], message);
  }
}
