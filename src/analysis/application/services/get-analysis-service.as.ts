import { GetAnalysisUseCase } from '../use-case/get-analysis-use-case.uc';
import { GetAnalysisResult } from '../results/get-analysis-result.result';
import { GetAnalysisFromIdCommand } from '../commands/get-analysis-from-id.command';
import { AnalysisId } from '../../domain/value-objects/analysis-id.vo';
import { Inject } from '@nestjs/common';
import { GET_DETAILED_ANALYSIS_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import type { IGetAnalysisFromIdPort } from '../ports/repositories/get-analysis-from-id-port.repository';
export class GetAnalysisService implements GetAnalysisUseCase {
  constructor(
    @Inject(GET_DETAILED_ANALYSIS_PORT)
    private readonly getAnalysisFromIdPort: IGetAnalysisFromIdPort,
  ) {}

  public async execute(command: GetAnalysisFromIdCommand): Promise<GetAnalysisResult> {
    try {
      const analysisId = AnalysisId.create(command.analysisId);
      const analysisData = await this.getAnalysisFromIdPort.getAnalysisFromId(analysisId);
      if (!analysisData) {
        return GetAnalysisResult.failure(`Analisi con ID ${command.analysisId} non trovata.`);
      }

      return GetAnalysisResult.success(analysisData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore interno del server';

      return GetAnalysisResult.failure(errorMessage);
    }
  }
}

export const GET_ANALYSIS_SERVICE = Symbol('GetAnalysisUseCase');
