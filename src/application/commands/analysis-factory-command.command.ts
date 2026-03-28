import { AnalysisType } from '../../domain/enums/analysis-type.enum';

export abstract class AnalysisFactoryCommand {
  protected constructor(
    public readonly userId: string,
    public readonly type: AnalysisType,
  ) {}
}
