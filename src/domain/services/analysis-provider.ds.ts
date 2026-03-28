import { Injectable } from '@nestjs/common';
import { AnalysisFactory } from '../factories/analysis-factory.factory.interface';
import { GitHubAnalysisFactory } from '../factories/github-analysis-factory.factory';
import { AnalysisFactoryCommand } from 'src/application/commands/analysis-factory-command.command';
import { Analysis } from '../entities/analysis.entity';

@Injectable()
export class AnalysisProvider {
  private readonly factories: AnalysisFactory[] = [];

  constructor() {
    this.factories.push(new GitHubAnalysisFactory());
  }

  public create(command: AnalysisFactoryCommand): Analysis {
    const factory = this.factories.find((f) => f.supports(command.type));
    if (!factory) {
      throw new Error('Analysis type not supported');
    }

    return factory.create(command);
  }
}
