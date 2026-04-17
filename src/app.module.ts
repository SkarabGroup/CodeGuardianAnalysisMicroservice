import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisModule } from './analysis/analysis.module';
import { ConfigurationModule } from './analysis/infrastructure/configuration/configuration.module';
import { ConfigurationService } from './analysis/infrastructure/configuration/configuration.service';

@Module({
  imports: [
    ConfigurationModule,
    MongooseModule.forRootAsync({
      connectionName: 'DatabaseConnection',
      useFactory: (config: ConfigurationService) => ({
        uri: config.mongoUri,
      }),
      inject: [ConfigurationService],
    }),
    AnalysisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
