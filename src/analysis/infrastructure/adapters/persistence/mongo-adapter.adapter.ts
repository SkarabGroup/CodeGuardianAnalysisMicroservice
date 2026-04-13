import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetGitCredentialRequest } from '../../../application/DTOs/models/requests/get-git-credential-request.model';
import { IGitCredentialReadPort } from '../../../application/ports/repositories/git-credential-read-port.repository';
import { GitCredential, GitCredentialDocument } from './schema/github-repo-credentials.schema';
import { GetGitCredentialResponse } from '../../../application/DTOs/models/responses/get-git-credential-response.model';
import { IGitCredentialSavePort } from '../../../application/ports/repositories/git-save-credential-port.repository';
import { PostGitCredentialRequest } from '../../../application/DTOs/models/requests/post-git-credential-request.model';
import { PostGitCredentialResponse } from '../../../application/DTOs/models/responses/post-git-credential-result.model';
import { DeleteGitCredentialRequest } from '../../../application/DTOs/models/requests/delete-git-credential-request.model';
import { DeleteGitCredentialResponse } from '../../../application/DTOs/models/responses/delete-git-credential-response.model';
import { UpdateGitCredentialPatRequest } from '../../../application/DTOs/models/requests/update-git-credential-pat-request.model';
import { UpdateGitCredentialPatResponse } from '../../../application/DTOs/models/responses/update-git-credential-pat-response.model';
import { IGitCredentialDeletePort } from '../../../application/ports/repositories/git-delete-credential-port.repository';
import { IGitCredentialUpdatePort } from '../../../application/ports/repositories/git-update-credential-port.repository';
import { IGitHubAnalysisSavePort } from '../../../application/ports/repositories/github-analysis-save-port.repository';
import { SaveGitHubAnalysisRequest } from '../../../application/DTOs/models/requests/save-git-analysis-request-model.model';
import { SaveGitHubAnalysisResponse } from '../../../application/DTOs/models/responses/save-git-analysis-response-model.model';
import { GitHubAnalysisRecord, GitHubAnalysisDocument } from './schema/github-analysis.schema';
//DocsReport related imports
import { SaveDocsReportRequest } from '../../../application/DTOs/models/requests/save-docs-report-request-model.model';
import { SaveDocsReportResponse } from '../../../application/DTOs/models/responses/save-docs-report-response-model.model';
import { DocumentationReport, DocumentationReportDocument } from './schema/docs-report.schema';
@Injectable() //Get
//Post
// Delete
// Update
export class MongoDBAdapter
  implements
    IGitCredentialReadPort,
    IGitCredentialSavePort,
    IGitCredentialDeletePort,
    IGitCredentialUpdatePort,
    IGitHubAnalysisSavePort
{
  public constructor(
    @InjectModel(GitCredential.name, 'DatabaseConnection')
    private readonly credentialModel: Model<GitCredentialDocument>,
    @InjectModel(GitHubAnalysisRecord.name, 'DatabaseConnection')
    private readonly analysisModel: Model<GitHubAnalysisDocument>,
    @InjectModel(DocumentationReport.name, 'DatabaseConnection')
    private readonly docsReportModel: Model<DocumentationReportDocument>,
  ) {}

  async authorize(model: GetGitCredentialRequest): Promise<GetGitCredentialResponse> {
    try {
      const credential = await this.credentialModel
        .findOne({ repoUrl: model.repoUrl.value })
        .lean()
        .exec();

      if (!credential) {
        return GetGitCredentialResponse.failure(
          'Credential not found for the specified repository URL',
        );
      }

      console.log(credential.password);
      const isValid = model.password.value === credential.password;

      return isValid
        ? GetGitCredentialResponse.success(credential.patToken)
        : GetGitCredentialResponse.failure('Wrong password');
    } catch (error) {
      return GetGitCredentialResponse.failure(
        `Connection error database: ${(error as Error).message}`,
      );
    }
  }

  async save(model: PostGitCredentialRequest): Promise<PostGitCredentialResponse> {
    try {
      await this.credentialModel.create({
        repoUrl: model.repoUrl.value,
        password: model.password.value,
        patToken: model.pat.value,
      });

      return PostGitCredentialResponse.success();
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return PostGitCredentialResponse.failure(
          `Credentials for repository ${model.repoUrl.value} already exist.`,
        );
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      return PostGitCredentialResponse.failure(`Error during saving: ${message}`);
    }
  }

  async deletePAT(request: DeleteGitCredentialRequest): Promise<DeleteGitCredentialResponse> {
    try {
      await this.credentialModel.deleteOne({
        repoUrl: request.repoUrl.value,
        password: request.patPassword.value,
      });
      return DeleteGitCredentialResponse.success();
    } catch (error) {
      return DeleteGitCredentialResponse.failure(
        `Connection to database failed: ${(error as Error).message}`,
      );
    }
  }

  async updatePAT(request: UpdateGitCredentialPatRequest): Promise<UpdateGitCredentialPatResponse> {
    try {
      const result = await this.credentialModel.updateOne(
        { repoUrl: request.repoUrl.value, password: request.patPassword.value },
        { patToken: request.newPat.value },
      );

      if (result.matchedCount === 0) {
        return UpdateGitCredentialPatResponse.failure(
          'Credentials not found or incorrect password',
        );
      }

      return UpdateGitCredentialPatResponse.success();
    } catch (error) {
      return UpdateGitCredentialPatResponse.failure(
        `Error updating token: ${(error as Error).message}`,
      );
    }
  }

  async saveAnalysis(request: SaveGitHubAnalysisRequest): Promise<SaveGitHubAnalysisResponse> {
    try {
      await this.analysisModel.create({
        analysisId: request.analysisId.value,
        userId: request.userId.value,
        repoURL: request.repoURL.value,
        branch: request.branch.value,
        commit: request.commit.value,
        status: request.status,
      });

      return SaveGitHubAnalysisResponse.success();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return SaveGitHubAnalysisResponse.failure(`Error saving analysis: ${message}`);
    }
  }

  async saveDocsReport(model: SaveDocsReportRequest): Promise<SaveDocsReportResponse> {
    try {
      await this.docsReportModel.create({
        reportId: model.reportId.value,
        analysisId: model.analysisId.value,

        // Mappatura API Violations
        apiViolations: model.apiViolations.map((v) => ({
          path: v.getPathFinding().value,
          rule: v.getRule(),
          severity: v.getSeverityFinding().value,
          description: v.getDescriptionFinding().value,
        })),

        // Mappatura Docs Discrepancies
        docsDiscrepancies: model.docsDiscrepancies.map((d) => ({
          path: d.getPathFinding().value,
          discrepancyCategory: d.getDiscrepancyCategory(),
          severity: d.getSeverityFinding().value,
          docsClaim: d.getDocsClaim().value,
          actualFinding: d.getActualFinding().value,
        })),

        // Mappatura Missing Files
        missingFiles: model.missingFiles.map((mf) => ({
          referencedPath: mf.getReferencedPath().value,
          referencedIn: mf.getReferencedIn().value,
          description: mf.getDescriptionFinding().value,
          status: mf.getStatusMissing(),
        })),

        // Mappatura Dependency Audit (se presente)
        dependencyAudit: model.dependencyAudit
          ? {
              readmeDefined: model.dependencyAudit.getReadmeDefined().map((dep) => ({
                name: dep.getName(),
                versionClaimed: dep.getVersionClaimed(),
              })),
              configDefined: model.dependencyAudit.getConfigDefined().map((dep) => ({
                name: dep.getName(),
                versionPinned: dep.getVersionPinned(),
                path: dep.getPathFinding().value,
              })),
              missingInConfig: model.dependencyAudit.getMissingInConfig().map((dep) => ({
                name: dep.getName(),
                path: dep.getPathFinding().value,
                severity: dep.getSeverityFinding().value,
              })),
              undocumentedInReadme: model.dependencyAudit.getUndocumentedInReadme().map((dep) => ({
                name: dep.getName(),
                path: dep.getPathFinding().value,
              })),
              versionMismatches: model.dependencyAudit.getVersionMismatches().map((dep) => ({
                name: dep.getName(),
                readmeVersion: dep.getReadmeVersion(),
                configVersion: dep.getConfigVersion(),
                path: dep.getPathFinding().value,
              })),
            }
          : null,
      });

      return SaveDocsReportResponse.success();
    } catch (error) {
      // Logga l'errore se necessario e restituisci il fallimento
      return SaveDocsReportResponse.failure(
        error instanceof Error ? error.message : 'Unknown error during Documentation Report save',
      );
    }
  }
  /*
  async saveCodeReport(request: SaveCodeReportRequest): Promise<SaveCodeReportResponse> {
    try {
      await this.codeReportModel.create({
        reportId: request.reportId.value,
        analysisId: request.analysisId.value,
        coverageFinding: request.coverageFinding.map((f) => ({
          totalLinesPercentage: f.getTotalLinesPercentage().value,
          totalBranchesPercentage: f.getTotalBranchesPercentage().value,
          analyzedLanguage: f.getAnalyzedLanguage(),
          coverageFiles: f.getCoverageFiles().map((file) => ({
            path: file.getPath().value,
            linesPercentage: file.getLinesPercentage().value,
            branchesPercentage: file.getBranchesPercentage().value,
            missedLines: file.getMissedLines(),
          })),
        })),
        staticAnalysisErrors: request.staticAnalysisErrors.map((e) => ({
          path: e.getPathFinding().value,
          category: e.getErrorCategory(),
          error: {
            line: e.getErrorFinding().getErrorLine(),
            description: e.getErrorFinding().getDescriptionFinding().value,
            severity: e.getErrorFinding().getSeverityFinding().value,
          },
          language: e.getAnalyzedLanguage(),
        })),
      });

      return SaveCodeReportResponse.success();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return SaveCodeReportResponse.failure(`Error saving code report: ${message}`);
    }
  }
*/
}

export const GIT_CREDENTIAL_READ_PORT = Symbol('IGitCredentialReadPort');
export const GIT_CREDENTIAL_SAVE_PORT = Symbol('IGitCredentialSavePort');
export const GIT_CREDENTIAL_DELETE_PORT = Symbol('IGitCredentialDeletePort');
export const GIT_CREDENTIAL_UPDATE_PORT = Symbol('IGitCredentialUpdatePort');
export const GITHUB_ANALYSIS_SAVE_PORT = Symbol('IGitHubAnalysisSavePort');
export const CODE_REPORT_SAVE_PORT = Symbol('ICodeReportSavePort');
