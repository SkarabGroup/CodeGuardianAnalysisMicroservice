import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {
    this.validateEnv();
  }

  private validateEnv(): void {
    const requiredVars = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'AWS_REGION', 'CODE_GUARDIAN_TOKEN'];

    for (const reqVar of requiredVars) {
      if (!this.configService.get(reqVar)) {
        throw new Error(`CRITICAL FATAL ERROR: Missing environmental variable -> ${reqVar}`);
      }
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
}
