import { AnalysisId } from '../../../domain/value-objects/analysis-id.vo';
import { BranchName } from '../../../domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../../domain/value-objects/personal-access-token.vo';
import { RepoURL } from '../../../domain/value-objects/repo-url.vo';

export interface IRepositoryCloner {
  clone(
    repoUrl: RepoURL,
    analysisId: AnalysisId,
    patToken: PersonalAccessToken | null,
    branch: BranchName | null,
    commit: CommitHash | null,
  ): Promise<string>;
}
