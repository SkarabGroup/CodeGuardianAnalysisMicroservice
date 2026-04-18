import { GetAnalysisResponseDTO } from './get-analysis-by-id.dto';

export class GetFullRepositoryCollectionDetailsResponseDTO {
  constructor(
    public readonly success: boolean,
    public readonly message?: string,
    public readonly data?: {
      url: string;
      name: string;
      description: string | null;
      analyses: GetAnalysisResponseDTO[];
    },
  ) {}

  static success(data: {
    url: string;
    name: string;
    description: string | null;
    analyses: GetAnalysisResponseDTO[];
  }): GetFullRepositoryCollectionDetailsResponseDTO {
    return new GetFullRepositoryCollectionDetailsResponseDTO(true, undefined, data);
  }

  static failure(message: string): GetFullRepositoryCollectionDetailsResponseDTO {
    return new GetFullRepositoryCollectionDetailsResponseDTO(false, message);
  }
}
