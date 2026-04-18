import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './analysis/infrastructure/configuration/configuration.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigurationService);
  const port = config.port;
  await app.listen(port);
  Logger.log(`Analysis Microservice running on: http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
