import { Injectable } from '@nestjs/common';
import { AnalysisModel } from '../../../application/DTOs/models/analysis-model.model';
import { GitHubAnalysisMapper } from '../../../application/mappers/github-analysis-model-mapper.mapper';
import { Analysis } from '../../../domain/entities/analysis.entity';
import { GitHubAnalysis } from '../../../domain/entities/github-analysis.entity';

@Injectable()
export class AnalysisTransformer {
  public toAnalysisModel(entity: Analysis): AnalysisModel | Error {
    if (entity instanceof GitHubAnalysis) {
      return GitHubAnalysisMapper.toModel(entity);
    }

    throw new Error('Analysis type not supported');
  }
}
