import { Injectable } from '@nestjs/common';
import { AnalysisModel } from '../../../application/DTOs/models/analysis-model.model';
import { GitHubAnalysisMapper } from '../../../application/mappers/github-analysis-model-mapper.mapper';
import { Analysis } from '../../../domain/entities/analysis.entity';
import { GitHubAnalysis } from '../../../domain/entities/github-analysis.entity';
import { AnalysisType } from '../../../domain/enums/analysis-type.enum';

@Injectable()
export class AnalysisTransformer {
  public toAnalysisModel(entity: Analysis): AnalysisModel {
    switch (entity.getType()) {
      case AnalysisType.GITHUB:
        return GitHubAnalysisMapper.toModel(entity as GitHubAnalysis);

      default:
        throw new Error('Analysis type not supported');
    }
  }
}
