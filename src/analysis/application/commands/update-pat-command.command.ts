import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
export class UpdatePatCommand {
  @IsUrl()
  @IsNotEmpty()
  public readonly repositoryUrl: string;

  @IsNotEmpty()
  @IsString()
  public readonly patPassword: string;

  @IsNotEmpty()
  @IsString()
  public readonly newPat: string;

  constructor(data: { repositoryUrl: string; patPassword: string; newPat: string }) {
    this.repositoryUrl = data.repositoryUrl;
    this.patPassword = data.patPassword;
    this.newPat = data.newPat;
  }
}
