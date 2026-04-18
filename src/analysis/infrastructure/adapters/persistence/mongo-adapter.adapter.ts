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
import { SaveDocsReportRequest } from '../../../application/DTOs/models/requests/save-docs-report-request-model.model';
import { SaveDocsReportResponse } from '../../../application/DTOs/models/responses/save-docs-report-response-model.model';
import { DocumentationReport, DocumentationReportDocument } from './schema/docs-report.schema';
import { AddReportsToAnalysisRequest } from '../../../application/DTOs/models/requests/add-reports-request-model.model';
import { AddReportsToAnalysisResult } from '../../../application/DTOs/models/responses/add-reports-result-model.model';
import {
  GitHubAnalysisGeneralDataDTO,
  GitHubAnalysisDetailedResult,
} from '../../../application/DTOs/models/responses/get-github-analysis-from-id-result-model.model';
import { AnalysisId } from '../../../domain/value-objects/analysis-id.vo';

import { DocsAnalysisReportDTO } from '../../../application/DTOs/models/responses/docs-agent-response-model.model';
import { IGetAnalysisFromIdPort } from '../../../application/ports/repositories/get-analysis-from-id-port.repository';

import { IUpdateAnalysisPort } from '../../../application/ports/repositories/update-analysis-port.port';
import { IDocsReportSavePort } from '../../../application/ports/repositories/docs-report-save-port.port';
import { SaveCodeReportRequest } from '../../../application/DTOs/models/requests/save-code-report-request-model.model';
import { SaveCodeReportResponse } from '../../../application/DTOs/models/responses/save-code-report-response-model.model';
import { CodeReport, CodeReportDocument } from './schema/code-report.schema';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { GetAllAnalysesForUserResponse } from '../../../application/DTOs/models/responses/get-all-analyses-for-user-response.model';
import { IGetAllAnalysesForUserPort } from '../../../application/ports/repositories/get-all-analyses-for-user-port.port';
import { CodeAnalysisReportDTO } from '../../../application/DTOs/models/responses/code-agent-response-model.model';
import { ICollectionDuplicateCheckerPort } from '../../../application/ports/repositories/collection-duplicate-checker-port.port';
import { CheckCollectionDuplicateRequest } from '../../../application/DTOs/models/requests/check-collection-duplicate-request.model';
import { CheckCollectionDuplicateResponse } from '../../../application/DTOs/models/responses/check-collection-duplicate-response.model';
import { GitHubCollection, GitHubCollectionDocument } from './schema/github-collection.schema';
import { ICollectionAdderPort } from '../../../application/ports/repositories/add-collection-port.port';
import { AddRepositoryCollectionRequest } from '../../../application/DTOs/models/requests/add-repository-collection-request.model';
import { AddRepositoryCollectionResponse } from '../../../application/DTOs/models/responses/add-repository-collection-response.model.model';
import { IGetRepositoryCollectionPort } from '../../../application/ports/repositories/get-repository-collection-port.port';
import { GetRepositoryCollectionRequest } from '../../../application/DTOs/models/requests/get-repository-collection-request.model';
import { GetRepositoryCollectionResponse } from '../../../application/DTOs/models/responses/get-repository-collection-response.model';
import { GetRepositoryCollectionResult } from '../../../application/results/get-repository-collection-result.result';
import { DeleteRepositoryCollectionRequest } from '../../../application/DTOs/models/requests/delete-repository-collection-request.model';
import { DeleteRepositoryCollectionResult } from '../../../application/results/delete-repository-collection-result.result';
import { GetAllRepositoryCollectionsRequest } from '../../../application/DTOs/models/requests/get-all-repository-collection-request.model';
import {
  CollectionDataResponse,
  GetAllRepositoryCollectionsResponse,
} from '../../../application/DTOs/models/responses/get-all-repository-collections-response.model';
import { IGetAllRepositoryCollectionsPort } from '../../../application/ports/repositories/get-all-repository-collections-port.port';

export interface MongoDeleteResult {
  acknowledged: boolean;
  deletedCount: number;
  n?: number; // Legacy property for older MongoDB/Mongoose versions
}
@Injectable()
export class MongoDBAdapter
  implements
    IGitCredentialReadPort,
    IGitCredentialSavePort,
    IGitCredentialDeletePort,
    IGitCredentialUpdatePort,
    IGitHubAnalysisSavePort,
    IGetAnalysisFromIdPort,
    IDocsReportSavePort,
    IUpdateAnalysisPort,
    IGetAllAnalysesForUserPort,
    ICollectionDuplicateCheckerPort,
    ICollectionAdderPort,
    IGetRepositoryCollectionPort,
    IGetAllRepositoryCollectionsPort
{
  public constructor(
    @InjectModel(GitCredential.name, 'DatabaseConnection')
    private readonly credentialModel: Model<GitCredentialDocument>,
    @InjectModel(GitHubAnalysisRecord.name, 'DatabaseConnection')
    private readonly analysisModel: Model<GitHubAnalysisDocument>,
    @InjectModel(DocumentationReport.name, 'DatabaseConnection')
    private readonly docsReportModel: Model<DocumentationReportDocument>,
    @InjectModel(CodeReport.name, 'DatabaseConnection')
    private readonly codeReportModel: Model<CodeReportDocument>,
    @InjectModel(GitHubCollection.name, 'DatabaseConnection')
    private readonly collectionModel: Model<GitHubCollectionDocument>,
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
        codeReportId: request.codeReportId?.value ?? null,
        docsReportId: request.docsReportId?.value ?? null,
        securityReportId: request.securityReportId?.value ?? null,
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

        apiViolations: model.apiViolations.map((v) => ({
          path: v.getPathFinding().value,
          rule: v.getRule(),
          severity: v.getSeverityFinding().value,
          description: v.getDescriptionFinding().value,
        })),

        docsDiscrepancies: model.docsDiscrepancies.map((d) => ({
          path: d.getPathFinding().value,
          discrepancyCategory: d.getDiscrepancyCategory(),
          severity: d.getSeverityFinding().value,
          docsClaim: d.getDocsClaim().value,
          actualFinding: d.getActualFinding().value,
        })),

        missingFiles: model.missingFiles.map((mf) => ({
          referencedPath: mf.getReferencedPath().value,
          referencedIn: mf.getReferencedIn().value,
          description: mf.getDescriptionFinding().value,
          status: mf.getStatusMissing(),
        })),

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
      return SaveDocsReportResponse.failure(
        error instanceof Error ? error.message : 'Unknown error during Documentation Report save',
      );
    }
  }

  async addReportsToAnalysis(
    model: AddReportsToAnalysisRequest,
  ): Promise<AddReportsToAnalysisResult> {
    try {
      await this.analysisModel.updateOne(
        { analysisId: model.analysisId },
        {
          $set: {
            status: 'COMPLETED',
            codeReportId: model.codeReportId,
            docsReportId: model.documentationReportId,
            securityReportId: model.securityReportId,
          },
        },
      );
      return AddReportsToAnalysisResult.success();
    } catch (error) {
      return AddReportsToAnalysisResult.failure(
        error instanceof Error ? error.message : 'Unknown error during adding reports to analysis',
      );
    }
  }

  async getAnalysisFromId(analysisId: AnalysisId): Promise<GitHubAnalysisDetailedResult | null> {
    try {
      // 1. Recupero il record dell'analisi
      const analysisRecord = await this.analysisModel
        .findOne({ analysisId: analysisId.value })
        .lean()
        .exec();

      if (!analysisRecord) return null;

      let docsReportDTO: DocsAnalysisReportDTO | null = null;
      let codeReportDTO: CodeAnalysisReportDTO | null = null;
      if (analysisRecord.docsReportId) {
        console.log(`Fetching Docs Report with ID: ${analysisRecord.docsReportId}`);
        const reportDoc = await this.docsReportModel
          .findOne({ reportId: analysisRecord.docsReportId })
          .lean()
          .exec();

        if (reportDoc) {
          docsReportDTO = {
            metadata: {
              repository: analysisRecord.repoURL,
              status: analysisRecord.status,
            },
            API_standard_violations: reportDoc.apiViolations.map((v) => ({
              file: v.path,
              rule: v.rule,
              severity: v.severity,
              message: v.description,
            })),
            docs_discrepancies: reportDoc.docsDiscrepancies.map((d) => ({
              category: d.discrepancyCategory,
              documentation_source: d.path,
              docs_claim: d.docsClaim,
              actual_finding: d.actualFinding,
              severity: d.severity,
            })),
            missing_files: reportDoc.missingFiles.map((mf) => ({
              referenced_path: mf.referencedPath,
              referenced_in: mf.referencedIn,
              context: mf.description,
              status: mf.status,
            })),
            dependency_audit: {
              readme_defined:
                reportDoc.dependencyAudit?.readmeDefined.map((rd) => ({
                  name: rd.name,
                  version_pinned: rd.versionClaimed,
                  source_file: rd.name,
                })) || [],
              config_defined:
                reportDoc.dependencyAudit?.configDefined.map((cd) => ({
                  name: cd.name,
                  version_pinned: cd.versionPinned,
                  source_file: cd.path,
                })) || [],
              missing_in_config:
                reportDoc.dependencyAudit?.missingInConfig.map((mic) => ({
                  name: mic.name,
                  severity: mic.severity,
                  source_file: mic.path,
                })) || [],
              undocumented_in_readme:
                reportDoc.dependencyAudit?.undocumentedInReadme.map((uir) => ({
                  name: uir.name,
                  found_in: uir.path,
                })) || [],
              version_mismatches:
                reportDoc.dependencyAudit?.versionMismatches.map((vm) => ({
                  name: vm.name,
                  version_pinned: vm.readmeVersion,
                  config_version: vm.configVersion,
                  source_file: vm.path,
                })) || [],
            },
          };
        }
      }

      if (analysisRecord.codeReportId) {
        console.log(`Fetching Code Report with ID: ${analysisRecord.codeReportId}`);
        const codeDoc = await this.codeReportModel
          .findOne({ reportId: analysisRecord.codeReportId })
          .lean()
          .exec();

        if (codeDoc) {
          codeReportDTO = {
            metadata: {
              language: codeDoc.metadata.language || 'UNKNOWN',
              status: codeDoc.metadata.status,
            },
            ai_interpretation: {
              verdict: codeDoc.interpretation.verdict,
              executive_summary: codeDoc.interpretation.executiveSummary,
              static_analysis_evaluation: {
                total_issues_analyzed:
                  codeDoc.interpretation.staticAnalysisEvaluation.totalIssuesAnalyzed,
                key_issues_reasoning:
                  codeDoc.interpretation.staticAnalysisEvaluation.keyIssuesReasoning.map(
                    (issue) => ({
                      file: issue.file,
                      location: {
                        line_start: issue.location.lineStart,
                        line_end: issue.location.lineEnd,
                        column: issue.location.column,
                      },
                      rule: issue.rule,
                      severity: issue.severity,
                      original_description: issue.originalDescription,
                      ai_reasoning: issue.aiReasoning,
                      suggested_resolution: issue.suggestedResolution || '',
                    }),
                  ),
              },
              coverage_evaluation: {
                overall_health: codeDoc.interpretation.coverageEvaluation.overallHealth,
                critical_files_reasoning:
                  codeDoc.interpretation.coverageEvaluation.criticalFilesReasoning.map((file) => ({
                    file: file.file,
                    line_coverage_pct: file.lineCoveragePct,
                    missing_lines: file.missingLines || [],
                    missing_branches: file.missingBranches,
                    ai_reasoning: file.aiReasoning,
                  })),
              },
            },
          };
        }
      }

      const generalData: GitHubAnalysisGeneralDataDTO = {
        analysisId: analysisRecord.analysisId,
        userId: analysisRecord.userId,
        repoURL: analysisRecord.repoURL,
        branch: analysisRecord.branch,
        commit: analysisRecord.commit,
        status: analysisRecord.status,
        createdAt: analysisRecord.createdAt!,
        updatedAt: analysisRecord.updatedAt!,
      };
      console.log('Docs Report DTO:', docsReportDTO);
      console.log('Code Report DTO:', codeReportDTO);

      return new GitHubAnalysisDetailedResult(generalData, docsReportDTO, codeReportDTO);
    } catch (error) {
      console.error('Error fetching detailed analysis:', error);
      throw new Error('Could not retrieve detailed analysis');
    }
  }
  async saveCodeReport(model: SaveCodeReportRequest): Promise<SaveCodeReportResponse> {
    try {
      await this.codeReportModel.create({
        reportId: model.reportId.value,
        analysisId: model.analysisId.value,

        metadata: {
          language: model.codeAgentMetadata.language,
          status: model.codeAgentMetadata.status,
        },

        interpretation: {
          verdict: model.aiInterpretation.verdict,
          executiveSummary: model.aiInterpretation.executiveSummary.value,

          staticAnalysisEvaluation: {
            totalIssuesAnalyzed:
              model.aiInterpretation.staticAnalysisEvaluation.totalIssuesAnalyzed,
            keyIssuesReasoning:
              model.aiInterpretation.staticAnalysisEvaluation.keyIssuesReasoning.map((k) => ({
                file: k.file.value,
                location: {
                  lineStart: k.location.lineStart,
                  lineEnd: k.location.lineEnd,
                  column: k.location.column,
                },
                rule: k.rule,
                severity: k.severity.value,
                originalDescription: k.originalDescription.value,
                aiReasoning: k.aiReasoning.value,
                suggestedResolution: k.suggestedResolution.value,
              })),
          },

          coverageEvaluation: {
            overallHealth: model.aiInterpretation.coverageEvaluation.overallHealth,
            criticalFilesReasoning:
              model.aiInterpretation.coverageEvaluation.criticalFilesReasoning.map((c) => ({
                file: c.file.value,
                lineCoveragePct: c.lineCoveragePct.value,
                missingLines: c.missingLines,
                missingBranches: c.missingBranches,
                aiReasoning: c.aiReasoning.value,
              })),
          },
        },
      });

      return SaveCodeReportResponse.success();
    } catch (error) {
      return SaveCodeReportResponse.failure(
        error instanceof Error ? error.message : 'Unknown error during Code Report save',
      );
    }
  }

  async getAllAnalysesForUser(id: UserId): Promise<GetAllAnalysesForUserResponse> {
    try {
      const analyses = await this.analysisModel.find({ userId: id.value }).lean().exec();

      const generalDataDTOs: GitHubAnalysisGeneralDataDTO[] = analyses.map((record) => ({
        analysisId: record.analysisId,
        userId: record.userId,
        repoURL: record.repoURL,
        branch: record.branch,
        commit: record.commit,
        status: record.status,
        createdAt: record.createdAt!,
        updatedAt: record.updatedAt!,
      }));

      return new GetAllAnalysesForUserResponse(generalDataDTOs);
    } catch (error) {
      throw new Error(
        `Error fetching analyses for user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async checkDuplicate(
    model: CheckCollectionDuplicateRequest,
  ): Promise<CheckCollectionDuplicateResponse> {
    try {
      const result = await this.collectionModel.exists({
        userId: model.user.value,
        url: model.url.value,
      });

      const exists = result !== null;

      return new CheckCollectionDuplicateResponse(exists);
    } catch (error) {
      console.error('Error checking collection existence:', error);
      return new CheckCollectionDuplicateResponse(false);
    }
  }

  async addCollection(
    model: AddRepositoryCollectionRequest,
  ): Promise<AddRepositoryCollectionResponse> {
    try {
      await this.collectionModel.create({
        userId: model.user.value,
        url: model.url.value,
        name: model.name,
        description: model.description ?? '',
        analyses: [],
      });

      return new AddRepositoryCollectionResponse(true);
    } catch (error) {
      console.error('Could not create collection:', (error as Error).message);

      return new AddRepositoryCollectionResponse(false);
    }
  }

  async getRepositoryCollection(
    model: GetRepositoryCollectionRequest,
  ): Promise<GetRepositoryCollectionResponse> {
    try {
      // 1. Recupera i dati anagrafici della collezione (nome, descrizione, ecc.)
      const collection = await this.collectionModel
        .findOne({
          url: model.url.value,
          userId: model.user.value,
        })
        .lean()
        .exec();

      if (!collection) {
        return GetRepositoryCollectionResult.failure('Collection not found');
      }

      // 2. Recupera dinamicamente TUTTE le analisi fatte da questo utente su questo URL.
      // Questo garantisce che vengano trovate anche le analisi effettuate PRIMA
      // della creazione della collezione.
      const analyses = await this.analysisModel
        .find({
          repoURL: model.url.value,
          userId: model.user.value,
        })
        .select('analysisId') // Ottimizzazione: scarichiamo solo l'ID dal DB
        .lean()
        .exec();

      const analysisIds = analyses.map((a) => a.analysisId);

      return GetRepositoryCollectionResult.success({
        url: collection.url,
        name: collection.name,
        description: collection.description || null,
        analyses: analysisIds,
      });
    } catch (error) {
      console.error('Error fetching collection:', error);
      return GetRepositoryCollectionResult.failure('Internal database error');
    }
  }

  async getAllCollections(
    request: GetAllRepositoryCollectionsRequest,
  ): Promise<GetAllRepositoryCollectionsResponse> {
    try {
      const collections = await this.collectionModel
        .find({ userId: request.user.value })
        .lean()
        .exec();

      const mappedCollections: CollectionDataResponse[] = await Promise.all(
        collections.map(async (c) => {
          const analyses = await this.analysisModel
            .find({
              repoURL: c.url,
              userId: request.user.value,
            })
            .select('analysisId')
            .lean()
            .exec();

          return {
            url: c.url,
            name: c.name,
            description: c.description || null,
            analyses: analyses.map((a) => a.analysisId),
          };
        }),
      );

      return GetAllRepositoryCollectionsResponse.success(mappedCollections);
    } catch (error) {
      return GetAllRepositoryCollectionsResponse.failure(
        error instanceof Error ? error.message : 'Error fetching user collections',
      );
    }
  }

  async deleteCollection(
    model: DeleteRepositoryCollectionRequest,
  ): Promise<DeleteRepositoryCollectionResult> {
    try {
      const result = (await this.collectionModel
        .deleteOne({
          url: model.url.value,
          userId: model.user.value,
        })
        .exec()) as MongoDeleteResult;

      // LOG FONDAMENTALE: vedi cosa risponde davvero il driver
      console.log('[Adapter] Mongoose Result:', result);

      // In alcune versioni di Mongoose/MongoDB, il campo potrebbe chiamarsi 'n' invece di 'deletedCount'
      const isDeleted = result.deletedCount > 0 || (result.n ?? 0) > 0;

      if (!isDeleted) {
        console.log('[Adapter] No document matched the criteria for deletion.');
        return DeleteRepositoryCollectionResult.failure('Collection not found');
      }

      return DeleteRepositoryCollectionResult.success();
    } catch (error) {
      console.error('[Adapter] Exception during deletion:', error);
      return DeleteRepositoryCollectionResult.failure((error as Error).message);
    }
  }
}

export const GIT_CREDENTIAL_READ_PORT = Symbol('IGitCredentialReadPort');
export const GIT_CREDENTIAL_SAVE_PORT = Symbol('IGitCredentialSavePort');
export const GIT_CREDENTIAL_DELETE_PORT = Symbol('IGitCredentialDeletePort');
export const GIT_CREDENTIAL_UPDATE_PORT = Symbol('IGitCredentialUpdatePort');
export const GITHUB_ANALYSIS_SAVE_PORT = Symbol('IGitHubAnalysisSavePort');
export const CODE_REPORT_SAVE_PORT = Symbol('ICodeReportSavePort');
export const DOCS_REPORT_SAVE_PORT = Symbol('IDocsReportSavePort');
export const ADD_REPORTS_TO_ANALYSIS_PORT = Symbol('IUpdateAnalysisPort');
export const GET_DETAILED_ANALYSIS_PORT = Symbol('IGetAnalysisFromIdPort');
export const GET_ALL_ANALYSES_FOR_USER_PORT = Symbol('IGetAllAnalysesForUserPort');

export const COLLECTION_DUPLICATE_PORT = Symbol('ICollectionDuplicateCheckerPort');
export const COLLECTION_ADDER_PORT = Symbol('ICollectionAdderPort');
export const COLLECTION_GETTER_PORT = Symbol('IGetCollectionRepositoryPort');
export const COLLECTION_DELETER_PORT = Symbol('IDeleteCollectionRepositoryPort');
export const ALL_COLLECTION_GETTER_PORT = Symbol('IGetAllCollectionRepositoryPort');
