import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    // 1. Inizializziamo la connessione globale a MongoDB
    // Usiamo la variabile d'ambiente definita nel Docker Compose
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/analysis_db', {
      // Usiamo il nome che il tuo sistema sta cercando per risolvere le dipendenze
      connectionName: 'DatabaseConnection',
    }),

    // 2. Importiamo il tuo modulo che contiene Controller e Use Case
    AnalysisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
