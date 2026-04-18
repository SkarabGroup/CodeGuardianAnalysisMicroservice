import { IsNotEmpty, IsString } from 'class-validator';

export class GetAllRepositoryCollectionsCommand {
  @IsNotEmpty()
  @IsString()
  public readonly user: string;
  constructor(public readonly userId: string) {
    this.user = userId;
  }
}
