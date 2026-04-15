import { IsNotEmpty, IsString } from 'class-validator';

export class GetAnalysisFromIdCommand {
  @IsNotEmpty()
  @IsString()
  //@IsUUID('7')
  public readonly _analysisId: string;
  constructor(public readonly analysisId: string) {
    this._analysisId = analysisId;
  }
}
