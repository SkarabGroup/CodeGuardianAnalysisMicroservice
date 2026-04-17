import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigurationService } from './analysis/infrastructure/configuration/configuration.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigurationService);
  const port = config.port;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Analysis Microservice')
    .setDescription('Documentazione API per il sistema di analisi repository')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Inserisci il token JWT',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  Logger.log(`Analysis Microservice running on: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger documentation available at: http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
