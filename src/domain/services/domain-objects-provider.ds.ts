import { Injectable } from '@nestjs/common';
import { v7 as uuid } from 'uuid';
import { StartAnalysisCommand } from '../../application/commands/start-analysis-command.command';
import { GitHubAnalysis } from '../entities/github-analysis.entity';
import { UserId } from '../value-objects/user-id.vo';
import { RepoURL } from '../value-objects/repo-url.vo';
import { BranchName } from '../value-objects/branch-name.vo';
import { CommitHash } from '../value-objects/commit-hash.vo';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { PATPassword } from '../value-objects/pat-password.vo';
import { IPATPasswordVOGeneratorInterface } from '../interfaces/pat-password-vo-generator.di';
import { PersonalAccessToken } from '../value-objects/personal-access-token.vo';
import { IPersonalAccessTokenVoGeneratorInterface } from '../interfaces/personal-access-token-vo-generator.di';

@Injectable()
export class DomainObjectsProvider
  implements IPATPasswordVOGeneratorInterface, IPersonalAccessTokenVoGeneratorInterface
{
  createGitHubAnalysisEntity(command: StartAnalysisCommand): GitHubAnalysis {
    if (!command.commitHash) {
      if (!command.branch) {
        return GitHubAnalysis.create(
          AnalysisId.create(uuid()),
          UserId.create(command.userId),
          RepoURL.create(command.repositoryUrl),
          BranchName.create('main'),
          null,
        );
      }

      return GitHubAnalysis.create(
        AnalysisId.create(uuid()),
        UserId.create(command.userId),
        RepoURL.create(command.repositoryUrl),
        BranchName.create(command.branch),
        null,
      );
    }

    return GitHubAnalysis.create(
      AnalysisId.create(uuid()),
      UserId.create(command.userId),
      RepoURL.create(command.repositoryUrl),
      null,
      CommitHash.create(command.commitHash),
    );
  }

  createPATPasswordVO(patPassword: string): PATPassword {
    return PATPassword.create(patPassword);
  }

  createPersonalAccessTokenVO(patPassword: string): PersonalAccessToken {
    return PersonalAccessToken.create(patPassword);
  }
}

export const PAT_PASSWORD_GENERATOR = Symbol('IPATPasswordVOGeneratorInterface');
export const PERSONAL_ACCESS_TOKEN_GENERATOR = Symbol('IPersonalAccessTokenVoGeneratorInterface');
