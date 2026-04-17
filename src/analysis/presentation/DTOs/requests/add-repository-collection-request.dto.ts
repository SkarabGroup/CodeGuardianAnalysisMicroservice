import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddRepositoryCollectionRequestDTO {
  @ApiProperty({
    example: 'https://github.com/user/repo',
    description: 'The URL of the repository to track',
  })
  public readonly url: string;

  @ApiProperty({
    example: 'Backend Project',
    description: 'A custom name for this collection',
  })
  public readonly name: string;

  @ApiPropertyOptional({
    example: 'Main repository for the core engine',
    description: 'An optional description for the collection',
  })
  public readonly description?: string;

  constructor(url: string, name: string, description?: string) {
    this.url = url;
    this.name = name;
    this.description = description || '';
  }
}
