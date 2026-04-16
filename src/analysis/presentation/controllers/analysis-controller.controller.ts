import {
  Body,
  Controller,
  Inject,
  Post,
  Get,
  UseGuards,
  createParamDecorator,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import type { StartAnalysisUseCase } from '../../application/use-case/start-analysis.uc';
import { START_ANALYSIS_SERVICE } from '../../application/services/start-analysis.as';
import { StartAnalysisRequestDTO } from '../DTOs/requests/request-analysis.dto';
import { StartAnalysisCommand } from '../../application/commands/start-analysis-command.command';
import { StartAnalysisResponseDTO } from '../DTOs/responses/start-analysis-response.dto';
import { StartAnalysisResult } from '../../application/results/start-analysis-result.result';
import { ConfigurationService } from '../../infrastructure/configuration/configuration.service';
import { GetAnalysisResponseDTO } from '../DTOs/responses/get-analysis-by-id.dto';
import { GetAnalysisFromIdCommand } from '../../application/commands/get-analysis-from-id.command';
import {
  GET_ALL_ANALYSES_FOR_USER_SERVICE,
  GET_ANALYSIS_SERVICE,
} from '../../application/services/get-analysis-service.as';
import type { GetAnalysisUseCase } from '../../application/use-case/get-analysis-use-case.uc';
import { GetAnalysisByIdRequestDTO } from '../DTOs/requests/get-analysis-by-id.dto';
import { GetAllAnalysesForUserResponseDTO } from '../DTOs/responses/get-all-analyses-for-user-response.dto';
import { GetAllAnalysesForUserCommand } from '../../application/commands/get-all-analyses-for-user-command.command';
import type { GetAllAnalysesForUserUseCase } from '../../application/use-case/get-all-analyses-for-user.uc';

export type JwtPayload = {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
};

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigurationService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    return await Promise.resolve({ userId: payload.sub, email: payload.email });
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export const userIdFactory = (_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user.userId;
};

export const UserId = createParamDecorator(userIdFactory);

@Controller('analysis')
export class AnalysisController {
  constructor(
    @Inject(START_ANALYSIS_SERVICE)
    private readonly startAnalysis: StartAnalysisUseCase,
    @Inject(GET_ANALYSIS_SERVICE)
    private readonly getAnalysis: GetAnalysisUseCase,
    @Inject(GET_ALL_ANALYSES_FOR_USER_SERVICE)
    private readonly getAllAnalyses: GetAllAnalysesForUserUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
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

    console.log(`Command created correctly. Commit: ${dto.commit}`);

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
  @UseGuards(JwtAuthGuard)
  @Get('one')
  public async getAnalysisById(
    @Body() dto: GetAnalysisByIdRequestDTO,
  ): Promise<GetAnalysisResponseDTO> {
    const analysisId = dto.analysisId;
    const command = new GetAnalysisFromIdCommand(analysisId);

    try {
      const result = await this.getAnalysis.execute(command);

      return GetAnalysisResponseDTO.fromResult(result);
    } catch (error) {
      return new GetAnalysisResponseDTO(
        false,
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  public async getAllAnalysesForUser(
    @UserId() userId: string,
  ): Promise<GetAllAnalysesForUserResponseDTO> {
    const command = new GetAllAnalysesForUserCommand(userId);
    try {
      const result = await this.getAllAnalyses.getAllAnalysesForUser(command);
      return GetAllAnalysesForUserResponseDTO.fromResult(result);
    } catch (error) {
      return new GetAllAnalysesForUserResponseDTO(
        false,
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }
}
