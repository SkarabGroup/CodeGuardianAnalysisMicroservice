import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
export class DeletePatCommand {
  @IsUrl()
  @IsNotEmpty()
  public readonly repositoryUrl: string;

  @IsNotEmpty()
  @IsString()
  public readonly patPassword: string;

  constructor(data: { repositoryUrl: string; patPassword: string }) {
    this.repositoryUrl = data.repositoryUrl;
    this.patPassword = data.patPassword;
  }
}
