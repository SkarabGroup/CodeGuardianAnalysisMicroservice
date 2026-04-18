export class GetRepositoryCollectionResponseDTO {
  constructor(
    public readonly success: boolean,
    public readonly message?: string,
    public readonly data?: {
      url: string;
      name: string;
      description: string | null;
      analyses: string[];
    },
  ) {}

  static success(data: {
    url: string;
    name: string;
    description: string | null;
    analyses: string[];
  }): GetRepositoryCollectionResponseDTO {
    return new GetRepositoryCollectionResponseDTO(true, undefined, data);
  }

  static failure(message: string): GetRepositoryCollectionResponseDTO {
    return new GetRepositoryCollectionResponseDTO(false, message);
  }
}
