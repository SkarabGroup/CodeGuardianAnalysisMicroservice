import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {
    this.validateEnv();
  }

  private validateEnv(): void {
    const requiredVars = [
      'MONGO_URI',
      'JWT_SECRET',
      'AWS_REGION',
      'CODE_GUARDIAN_TOKEN',
      'S3_BUCKET_NAME', // Aggiunto come obbligatorio
    ];

    for (const reqVar of requiredVars) {
      if (!this.configService.get(reqVar)) {
        throw new Error(`CRITICAL FATAL ERROR: Missing environmental variable -> ${reqVar}`);
      }
    }

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      if (!this.port)
        throw new Error('CRITICAL FATAL ERROR: Missing environmental variable -> PORT}');
    }
  }

  get isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  get port(): number {
    return this.configService.get<number>('PORT') || 3001;
  }

  get mongoUri(): string {
    return this.configService.get<string>('MONGO_URI')!;
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')!;
  }

  get awsRegion(): string {
    return this.configService.get<string>('AWS_REGION')!;
  }

  get codeGuardianToken(): string {
    return this.configService.get<string>('CODE_GUARDIAN_TOKEN')!;
  }

  // --- S3 & AWS Credentials ---

  get s3BucketName(): string {
    return this.configService.get<string>('S3_BUCKET_NAME')!;
  }

  get awsAccessKeyId(): string | undefined {
    return this.configService.get<string>('AWS_ACCESS_KEY_ID');
  }

  get awsSecretAccessKey(): string | undefined {
    return this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
  }

  // Nel ConfigurationService aggiungi questi getter
  get ecsClusterName(): string {
    return this.configService.get<string>('ECS_CLUSTER_NAME') || 'code-guardian-skarab-cluster';
  }

  get ecsTaskDefinitionCode(): string {
    return this.configService.get<string>('ECS_TASK_DEFINITION_CODE') || 'code-agent-task';
  }

  get ecsTaskDefinitionDocs(): string {
    return this.configService.get<string>('ECS_TASK_DEFINITION_DOCS') || 'docs-agent-task';
  }

  get ecsTaskDefinitionSecurity(): string {
    return this.configService.get<string>('ECS_TASK_DEFINITION_SECURITY') || 'security-agent-task';
  }

  get ecsSubnet(): string {
    return this.configService.get<string>('ECS_SUBNET') || '';
  }

  get ecsSecurityGroup(): string {
    return this.configService.get<string>('ECS_SECURITY_GROUP') || '';
  }
}
