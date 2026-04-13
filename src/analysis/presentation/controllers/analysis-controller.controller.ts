import {
  Body,
  Controller,
  Inject,
  Post,
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

export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user.userId;
});

@Controller('analysis')
export class AnalysisController {
  constructor(
    @Inject(START_ANALYSIS_SERVICE)
    private readonly startAnalysis: StartAnalysisUseCase,
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
      docs: dto.requestDocumentation,
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
}
