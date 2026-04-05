import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
export class NewPatCommand {
  @IsUrl()
  @IsNotEmpty()
  public readonly repositoryUrl: string;

  @IsNotEmpty()
  @IsString()
  public readonly patPassword: string;

  @IsString()
  @IsNotEmpty()
  public readonly personalAccessToken: string;

  constructor(data: { repositoryUrl: string; patPassword: string; personalAccessToken: string }) {
    this.repositoryUrl = data.repositoryUrl;
    this.patPassword = data.patPassword;
    this.personalAccessToken = data.personalAccessToken;
  }
}
