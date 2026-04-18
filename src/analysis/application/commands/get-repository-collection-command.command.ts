import { IsString, IsNotEmpty } from 'class-validator';

export class GetRepositoryCollectionCommand {
  @IsString()
  @IsNotEmpty()
  public readonly url: string;

  @IsString()
  @IsNotEmpty()
  public readonly user: string;

  constructor(data: { url: string; user: string }) {
    this.url = data.url;
    this.user = data.user;
  }
}
