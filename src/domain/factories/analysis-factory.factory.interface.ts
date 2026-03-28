import { AnalysisFactoryCommand } from '../../application/commands/analysis-factory-command.command';
import { Analysis } from '../entities/analysis.entity';
import { AnalysisType } from '../enums/analysis-type.enum';

export interface AnalysisFactory {
  create(command: AnalysisFactoryCommand): Analysis;
  supports(type: AnalysisType): boolean;
}
