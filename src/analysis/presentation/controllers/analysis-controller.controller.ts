import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';

import type { StartAnalysisUseCase } from '../../application/use-case/start-analysis.uc';
import { START_ANALYSIS_SERVICE } from '../../application/services/start-analysis.as';
import { StartAnalysisRequestDTO } from '../DTOs/requests/request-analysis.dto';
import { StartAnalysisCommand } from '../../application/commands/start-analysis-command.command';
import { StartAnalysisResponseDTO } from '../DTOs/responses/start-analysis-response.dto';
import { StartAnalysisResult } from '../../application/results/start-analysis-result.result';
import { JwtAuthGuard, UserId } from './helper/jwt-guard.helper';

@Controller('analysis')
export class AnalysisController {
  constructor(
    @Inject(START_ANALYSIS_SERVICE)
    private readonly startAnalysis: StartAnalysisUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  public async requestAnalysis(
    @Body() dto: StartAnalysisRequestDTO,
    @UserId() userId: string,
  ): Promise<StartAnalysisResponseDTO> {
    const command = new StartAnalysisCommand({
      user: userId,
      url: dto.repoUrl,
      password: dto.password || undefined,
      branch: dto.branch || undefined,
      commit: dto.commit || undefined,
      code: dto.requestedCode,
      docs: dto.requestedDocumentation,
      security: dto.requestedSecurity,
    });

    try {
      const result: StartAnalysisResult = await this.startAnalysis.execute(command);

      if (!result.success) {
        return StartAnalysisResponseDTO.failure(
          result.message || 'Impossible to analyze this repository',
        );
      }

      return StartAnalysisResponseDTO.success(
        result.user,
        result.id,
        result.url,
        result.branch,
        result.commit,
      );
    } catch (error) {
      return StartAnalysisResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }
}
