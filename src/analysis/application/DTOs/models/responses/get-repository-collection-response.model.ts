export class GetRepositoryCollectionResponse {
  constructor(
    public readonly success: boolean,
    public readonly url: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly analyses: string[],
    public readonly message?: string,
  ) {}

  public static success(payload: {
    url: string;
    name: string;
    description: string | null;
    analyses: string[];
  }): GetRepositoryCollectionResponse {
    return new GetRepositoryCollectionResponse(
      true,
      payload.url,
      payload.name,
      payload.description,
      payload.analyses,
    );
  }

  public static failure(message: string): GetRepositoryCollectionResponse {
    return new GetRepositoryCollectionResponse(false, '', '', '', [], message);
  }
}
