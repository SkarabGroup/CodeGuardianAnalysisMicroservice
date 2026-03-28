import { Injectable } from '@nestjs/common';
import { AnalysisFactory } from './analysis-factory.factory.interface';
import { AnalysisFactoryCommand } from 'src/application/commands/analysis-factory-command.command';
import { Analysis } from '../entities/analysis.entity';
import { AnalysisType } from '../enums/analysis-type.enum';
import { GitHubAnalysis } from '../entities/github-analysis.entity';
import { GitHubAnalysisCommand } from '../../application/commands/github-analysis-factory-command.command';
import { UserId } from '../value-objects/user-id.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';

@Injectable()
export class GitHubAnalysisFactory implements AnalysisFactory {
  public create(command: AnalysisFactoryCommand): Analysis {
    if (!(command instanceof GitHubAnalysisCommand)) {
      throw new Error('GitHubAnalysisFactory must receive a GitHubAnalysisCommand');
    }

    const user = UserId.create(command.userId);
    const url = RepoURL.create(command.repoURL);
    const branch = BranchName.create(command.branch);
    const commit = command.commit ? CommitHash.create(command.commit) : null;

    return GitHubAnalysis.create(user, url, branch, commit ?? undefined);
  }

  public supports(type: AnalysisType): boolean {
    return type === AnalysisType.GITHUB;
  }
}
