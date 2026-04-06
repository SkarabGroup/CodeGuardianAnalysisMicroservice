import { IsString, IsUrl, IsNotEmpty, IsOptional } from 'class-validator';

export class StartAnalysisCommand {
  @IsString()
  @IsNotEmpty()
  public readonly user: string;

  @IsUrl()
  @IsNotEmpty()
  public readonly repoURL: string;

  @IsOptional()
  @IsString()
  public readonly patPassword: string | undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly branch: string | undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly commitHash: string | undefined;

  constructor(data: {
    user: string;
    url: string;
    password?: string;
    branch?: string;
    commit?: string;
  }) {
    this.user = data.user;
    this.repoURL = data.url;
    this.patPassword = data.password;
    this.branch = data.branch;
    this.commitHash = data.commit;
  }
}
