import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddRepositoryCollectionCommand {
  @IsString()
  @IsNotEmpty()
  public readonly user: string;

  @IsString()
  @IsNotEmpty()
  public readonly url: string;

  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly description?: string | undefined = undefined;

  constructor(data: {
    user: string;
    repoUrl: string;
    collectionName: string;
    description?: string | undefined;
  }) {
    this.user = data.user;
    this.url = data.repoUrl;
    this.name = data.collectionName;
    this.description = data.description;
  }
}
