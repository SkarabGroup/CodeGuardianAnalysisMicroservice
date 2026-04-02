import { GitHubAnalysis } from '../../domain/entities/github-analysis.entity';
import { ValidationModel } from '../DTOs/models/responses/validation-model.model';

export interface IValidatorServiceInterface {
  validateAccess(analysis: GitHubAnalysis, patPassword: string): Promise<ValidationModel>;
}
