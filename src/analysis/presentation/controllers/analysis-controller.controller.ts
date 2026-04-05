import { Body, Controller, Inject, Post } from '@nestjs/common';

import type { StartAnalysisUseCase } from '../../application/use-case/start-analysis.uc';
import { START_ANALYSIS_SERVICE } from '../../application/services/start-analysis.as';
import { StartAnalysisRequestDTO } from '../DTOs/requests/request-analysis.dto';
import { StartAnalysisCommand } from '../../application/commands/start-analysis-command.command';

import { v7 as uuid } from 'uuid';
import { StartAnalysisResponseDTO } from '../DTOs/responses/start-analysis-response.dto';
import { StartAnalysisResult } from '../../application/results/start-analysis-result.result';

@Controller('analysis')
export class AnalysisController {
  constructor(
    @Inject(START_ANALYSIS_SERVICE)
    private readonly startAnalysis: StartAnalysisUseCase,
  ) {}

  @Post('start')
  public async requestAnalysis(
    @Body() dto: StartAnalysisRequestDTO,
  ): Promise<StartAnalysisResponseDTO> {
    const command = new StartAnalysisCommand({
      userId: uuid(),
      repositoryUrl: dto.repoUrl,
    });

    try {
      const result: StartAnalysisResult = await this.startAnalysis.execute(command);
      if (!result.isSuccess) {
        return StartAnalysisResponseDTO.failure(
          result.error || 'Impossible to analyze this repository',
        );
      }

      return StartAnalysisResponseDTO.success('', result.analysisId!);
    } catch (error) {
      return StartAnalysisResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }
}
