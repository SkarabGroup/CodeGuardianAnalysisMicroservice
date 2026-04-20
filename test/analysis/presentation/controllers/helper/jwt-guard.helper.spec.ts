import { Test, TestingModule } from '@nestjs/testing';
import {
  JwtStrategy,
  JwtPayload,
  userIdFactory,
} from '../../../../../src/analysis/presentation/controllers/helper/jwt-guard.helper';
import { ConfigurationService } from '../../../../../src/analysis/infrastructure/configuration/configuration.service';
import { ExecutionContext } from '@nestjs/common';

describe('Auth Helpers', () => {
  describe('JwtStrategy', () => {
    let strategy: JwtStrategy;

    beforeEach(async () => {
      const mockConfig = {
        jwtSecret: 'test-secret',
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigurationService,
            useValue: mockConfig,
          },
        ],
      }).compile();

      strategy = module.get<JwtStrategy>(JwtStrategy);
    });

    it('should validate and return user data from payload', async () => {
      const payload: JwtPayload = {
        sub: 'user-id-456',
        email: 'test@example.com',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({ userId: 'user-id-456', email: 'test@example.com' });
    });
  });

  describe('UserId Decorator Factory', () => {
    it('should extract userId from request user object', () => {
      const mockRequest = {
        user: {
          userId: 'extracted-id-789',
          email: 'test@example.com',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = userIdFactory(null, mockContext);

      expect(result).toBe('extracted-id-789');
    });
  });
});
