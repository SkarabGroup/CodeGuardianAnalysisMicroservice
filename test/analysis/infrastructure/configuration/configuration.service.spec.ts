import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfigurationService } from '../../../../src/analysis/infrastructure/configuration/configuration.service';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  // 1. Aggiornato mockConfig con S3_BUCKET_NAME (obbligatorio) e i nuovi campi ECS
  const mockConfig: Record<string, string | number> = {
    PORT: 3001,
    MONGO_URI: 'mongodb://localhost:27017/test',
    JWT_SECRET: 'test_secret',
    AWS_REGION: 'eu-central-1',
    CODE_GUARDIAN_TOKEN: 'ghp_test_token',
    S3_BUCKET_NAME: 'test-bucket-name', // Fondamentale per la validazione
    NODE_ENV: 'development',
    ECS_CLUSTER_NAME: 'test-cluster',
    ECS_TASK_DEFINITION_CODE: 'code-task',
    ECS_TASK_DEFINITION_DOCS: 'docs-task',
    ECS_TASK_DEFINITION_SECURITY: 'security-task',
    ECS_SUBNET: 'subnet-123',
    ECS_SECURITY_GROUP: 'sg-456',
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

    it('should throw an error if S3_BUCKET_NAME is missing', async () => {
      const incompleteConfig = { ...mockConfig };
      delete incompleteConfig['S3_BUCKET_NAME'];

      await expect(createService(incompleteConfig)).rejects.toThrow(
        'CRITICAL FATAL ERROR: Missing environmental variable -> S3_BUCKET_NAME',
      );
    });

    it('should throw error in production if PORT is missing', async () => {
      const prodIncomplete = { ...mockConfig, NODE_ENV: 'production' };
      delete prodIncomplete['PORT'];

      // In produzione la validazione controlla esplicitamente il porto
      await expect(createService(prodIncomplete)).rejects.toThrow(
        'CRITICAL FATAL ERROR: Missing environmental variable -> PORT}',
      );
    });
  });

  describe('Getters', () => {
    beforeEach(async () => {
      const module: TestingModule = await createService(mockConfig);
      service = module.get<ConfigurationService>(ConfigurationService);
    });

    it('should return correct AWS and S3 values', () => {
      expect(service.s3BucketName).toBe(mockConfig['S3_BUCKET_NAME']);
      expect(service.awsRegion).toBe(mockConfig['AWS_REGION']);
    });

    it('should return correct ECS configuration values', () => {
      expect(service.ecsClusterName).toBe(mockConfig['ECS_CLUSTER_NAME']);
      expect(service.ecsTaskDefinitionCode).toBe(mockConfig['ECS_TASK_DEFINITION_CODE']);
      expect(service.ecsTaskDefinitionDocs).toBe(mockConfig['ECS_TASK_DEFINITION_DOCS']);
      expect(service.ecsTaskDefinitionSecurity).toBe(mockConfig['ECS_TASK_DEFINITION_SECURITY']);
      expect(service.ecsSubnet).toBe(mockConfig['ECS_SUBNET']);
      expect(service.ecsSecurityGroup).toBe(mockConfig['ECS_SECURITY_GROUP']);
    });

    it('should return default values for ECS if not provided', async () => {
      // Testiamo i fallback definiti nel service
      const minimalConfig = {
        ...mockConfig,
        ECS_CLUSTER_NAME: undefined,
        ECS_TASK_DEFINITION_CODE: undefined,
      };
      const module = await createService(minimalConfig);
      const localService = module.get<ConfigurationService>(ConfigurationService);

      expect(localService.ecsClusterName).toBe('code-guardian-skarab-cluster');
      expect(localService.ecsTaskDefinitionCode).toBe('code-agent-task');
    });
  });
});
