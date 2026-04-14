import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfigurationService } from '../../../../src/analysis/infrastructure/configuration/configuration.service';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  const mockConfig: Record<string, string | number> = {
    PORT: 3001,
    MONGO_URI: 'mongodb://localhost:27017/test',
    JWT_SECRET: 'test_secret',
    AWS_REGION: 'eu-central-1',
    CODE_GUARDIAN_TOKEN: 'ghp_test_token',
    NODE_ENV: 'development',
  };

  const createService = (envMock: Record<string, string | number>) => {
    return Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => envMock[key]),
          },
        },
      ],
    }).compile();
  };

  describe('Validation logic', () => {
    it('should initialize correctly when all variables are present', async () => {
      const module: TestingModule = await createService(mockConfig);
      service = module.get<ConfigurationService>(ConfigurationService);
      expect(service).toBeDefined();
    });

    it('should throw an error if a required variable is missing', async () => {
      const incompleteConfig = { ...mockConfig };
      delete incompleteConfig.MONGO_URI;

      await expect(createService(incompleteConfig)).rejects.toThrow(
        'CRITICAL FATAL ERROR: Missing environmental variable -> MONGO_URI',
      );
    });
  });

  describe('Getters', () => {
    beforeEach(async () => {
      const module: TestingModule = await createService(mockConfig);
      service = module.get<ConfigurationService>(ConfigurationService);
    });

    it('should return the correct port', () => {
      expect(service.port).toBe(3001);
    });

    it('should evaluate isProduction correctly', async () => {
      expect(service.isProduction).toBe(false);

      const prodConfig = { ...mockConfig, NODE_ENV: 'production' };
      const prodModule = await createService(prodConfig);
      const prodService = prodModule.get<ConfigurationService>(ConfigurationService);

      expect(prodService.isProduction).toBe(true);
    });

    it('should return correct configuration values', () => {
      expect(service.mongoUri).toBe(mockConfig.MONGO_URI);
      expect(service.jwtSecret).toBe(mockConfig.JWT_SECRET);
      expect(service.awsRegion).toBe(mockConfig.AWS_REGION);
      expect(service.codeGuardianToken).toBe(mockConfig.CODE_GUARDIAN_TOKEN);
    });
  });
});
