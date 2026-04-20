import { GetAnalysisUseCase } from '../use-case/get-analysis-use-case.uc';
import { GetAnalysisResult } from '../results/get-analysis-result.result';
import { GetAnalysisFromIdCommand } from '../commands/get-analysis-from-id.command';
import { AnalysisId } from '../../domain/value-objects/analysis-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Inject } from '@nestjs/common';
import { GET_DETAILED_ANALYSIS_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import type { IGetAnalysisFromIdPort } from '../ports/repositories/get-analysis-from-id-port.repository';
import { GET_ALL_ANALYSES_FOR_USER_PORT } from '../../infrastructure/adapters/persistence/mongo-adapter.adapter';
import type { IGetAllAnalysesForUserPort } from '../ports/repositories/get-all-analyses-for-user-port.port';
import { GetAllAnalysesForUserCommand } from '../commands/get-all-analyses-for-user-command.command';
import { GetAllAnalysesForUserResult } from '../results/get-all-analyses-for-user-result.result';
import { GetAllAnalysesForUserUseCase } from '../use-case/get-all-analyses-for-user.uc';
export class GetAnalysisService implements GetAnalysisUseCase, GetAllAnalysesForUserUseCase {
  constructor(
    @Inject(GET_DETAILED_ANALYSIS_PORT)
    private readonly getAnalysisFromIdPort: IGetAnalysisFromIdPort,
    @Inject(GET_ALL_ANALYSES_FOR_USER_PORT)
    private readonly getAllAnalysesForUserPort: IGetAllAnalysesForUserPort,
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

  public async getAllAnalysesForUser(
    command: GetAllAnalysesForUserCommand,
  ): Promise<GetAllAnalysesForUserResult> {
    try {
      const userId = command.userId;

      const analysesData = await this.getAllAnalysesForUserPort.getAllAnalysesForUser(
        UserId.create(userId),
      );
      return GetAllAnalysesForUserResult.success(analysesData.dto || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore interno del server';
      return GetAllAnalysesForUserResult.failure(errorMessage);
    }
  }
}

export const GET_ANALYSIS_SERVICE = Symbol('GetAnalysisUseCase');
export const GET_ALL_ANALYSES_FOR_USER_SERVICE = Symbol('GetAllAnalysesForUserUseCase');
