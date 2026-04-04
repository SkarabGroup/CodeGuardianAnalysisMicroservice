import { IsString, IsUrl, IsNotEmpty, IsOptional } from 'class-validator';

export class StartAnalysisCommand {
  @IsString()
  @IsNotEmpty()
  public readonly userId: string;

  @IsUrl()
  @IsNotEmpty()
  public readonly repositoryUrl: string;

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
    userId: string;
    repositoryUrl: string;
    patPassword?: string;
    branch?: string;
    commitHash?: string;
  }) {
    this.userId = data.userId;
    this.repositoryUrl = data.repositoryUrl;
    this.patPassword = data.patPassword;
    this.branch = data.branch;
    this.commitHash = data.commitHash;
  }
}
