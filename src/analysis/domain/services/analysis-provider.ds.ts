import { Injectable } from '@nestjs/common';
import { v7 as uuid } from 'uuid';
import { StartAnalysisCommand } from '../../application/commands/start-analysis-command.command';
import { GitHubAnalysis } from '../entities/github-analysis.entity';
import { UserId } from '../value-objects/user-id.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { IAnalysisFactory } from './analysis-factory.ds.interface';

@Injectable()
export class AnalysisProvider implements IAnalysisFactory {
  public createGitHubAnalysisEntity(command: StartAnalysisCommand): GitHubAnalysis {
    const analysisId = AnalysisId.create(uuid());
    const userId = UserId.create(command.userId);
    const repoUrl = RepoURL.create(command.repositoryUrl);

    if (!command.commitHash) {
      return GitHubAnalysis.create(
        analysisId,
        userId,
        repoUrl,
        command.branch ? BranchName.create(command.branch) : null,
        null,
      );
    }

    return GitHubAnalysis.create(
      analysisId,
      userId,
      repoUrl,
      null,
      CommitHash.create(command.commitHash),
    );
  }
}

export const ANALYSIS_PROVIDER = Symbol('IAnalysisFactory');
