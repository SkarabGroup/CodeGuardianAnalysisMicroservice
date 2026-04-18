import { ExecutionContext, createParamDecorator, Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { ConfigurationService } from '../../../infrastructure/configuration/configuration.service';

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
