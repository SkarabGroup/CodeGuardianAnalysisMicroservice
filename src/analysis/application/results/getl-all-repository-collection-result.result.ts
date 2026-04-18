export interface RepositoryCollectionData {
  url: string;
  name: string;
  description: string | null;
  analyses: string[];
  lastAnalysisDate: Date | null;
}

export class GetAllRepositoryCollectionsResult {
  constructor(
    public readonly success: boolean,
    public readonly collections: RepositoryCollectionData[],
    public readonly message?: string,
  ) {}

  public static success(
    collections: RepositoryCollectionData[],
  ): GetAllRepositoryCollectionsResult {
    return new GetAllRepositoryCollectionsResult(true, collections);
  }

  public static failure(message: string): GetAllRepositoryCollectionsResult {
    return new GetAllRepositoryCollectionsResult(false, [], message);
  }
}
