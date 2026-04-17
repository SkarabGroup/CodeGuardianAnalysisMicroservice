import { IsNotEmpty, IsString } from 'class-validator';

export class GetAllAnalysesForUserCommand {
  @IsNotEmpty()
  @IsString()
  //@IsUUID('7')
  public readonly _userId: string;
  constructor(public readonly userId: string) {
    this._userId = userId;
  }
}
