import { IsString, IsUrl, IsNotEmpty, IsOptional } from 'class-validator';

export class StartAnalysisCommand {
  @IsString()
  @IsNotEmpty()
  public readonly user: string;

  @IsUrl()
  @IsNotEmpty()
  public readonly url: string;

  @IsOptional()
  @IsString()
  public readonly password?: string | undefined = undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly branch?: string | undefined = undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly commit?: string | undefined = undefined;

  constructor(data: {
    user: string;
    url: string;
    password?: string | undefined;
    branch?: string | undefined;
    commit?: string | undefined;
  }) {
    this.user = data.user;
    this.url = data.url;
    this.password = data.password;
    this.branch = data.branch;
    this.commit = data.commit;
  }
}
