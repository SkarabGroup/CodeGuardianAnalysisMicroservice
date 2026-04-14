import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { GitCredential } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/github-repo-credentials.schema';
import { MongoDBAdapter } from '../../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GetGitCredentialRequest } from '../../../../../src/analysis/application/DTOs/models/requests/get-git-credential-request.model';
import { PostGitCredentialRequest } from '../../../../../src/analysis/application/DTOs/models/requests/post-git-credential-request.model';
import { DeleteGitCredentialRequest } from '../../../../../src/analysis/application/DTOs/models/requests/delete-git-credential-request.model';
import { UpdateGitCredentialPatRequest } from '../../../../../src/analysis/application/DTOs/models/requests/update-git-credential-pat-request.model';
import { RepoURL } from '../../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../../src/analysis/domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../../src/analysis/domain/value-objects/personal-access-token.vo';
import { GitHubAnalysisRecord } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/github-analysis.schema';
import { SaveGitHubAnalysisRequest } from '../../../../../src/analysis/application/DTOs/models/requests/save-git-analysis-request-model.model';
import { AnalysisId } from '../../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { UserId } from '../../../../../src/analysis/domain/value-objects/user-id.vo';
import { BranchName } from '../../../../../src/analysis/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { AnalysisStatus } from '../../../../../src/analysis/domain/enums/analysis-status.enum';
import { v7 as uuid } from 'uuid';
import { DocumentationReport } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/docs-report.schema';
import { ReportId } from '../../../../../src/analysis/domain/value-objects/report-id.vo';
import { CodeReport } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/code-report.schema';

interface MockQuery {
  lean: jest.Mock<MockQuery, []>;
  exec: jest.Mock<Promise<GitCredential | null>, []>;
}

interface MockModel {
  findOne: jest.Mock<MockQuery, [Record<string, unknown>]>;
  create: jest.Mock<Promise<Partial<GitCredential>>, [Partial<GitCredential>]>;
  deleteOne: jest.Mock<Promise<{ deletedCount: number }>, [Record<string, unknown>]>;
  updateOne: jest.Mock<
    Promise<{ matchedCount: number; modifiedCount: number }>,
    [Record<string, unknown>, Partial<GitCredential>]
  >;
}
interface MockAnalysisModel {
  create: jest.Mock;
}

interface MongoError extends Error {
  code: number;
}

interface MockDocsReportModel {
  create: jest.Mock;
}

const VALID_PASSWORD = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const VALID_PAT = 'ghp_' + 'A'.repeat(36);

describe('MongoDBAdapter (Unit Test)', () => {
  let adapter: MongoDBAdapter;
  let mockModel: MockModel;
  let mockQuery: MockQuery;
  let consoleLogSpy: jest.SpyInstance;
  let mockAnalysisModel: MockAnalysisModel;
  let mockDocsReportModel: MockDocsReportModel;
  let mockCodeReportModel: MockDocsReportModel;

  beforeEach(async () => {
    mockQuery = {
      lean: jest.fn().mockReturnThis() as jest.Mock<MockQuery, []>,
      exec: jest.fn() as jest.Mock<Promise<GitCredential | null>, []>,
    };

    mockModel = {
      findOne: jest.fn().mockReturnValue(mockQuery) as jest.Mock<
        MockQuery,
        [Record<string, unknown>]
      >,
      create: jest.fn() as jest.Mock<Promise<Partial<GitCredential>>, [Partial<GitCredential>]>,
      deleteOne: jest.fn() as jest.Mock<
        Promise<{ deletedCount: number }>,
        [Record<string, unknown>]
      >,
      updateOne: jest.fn() as jest.Mock<
        Promise<{ matchedCount: number; modifiedCount: number }>,
        [Record<string, unknown>, Partial<GitCredential>]
      >,
    };

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mockAnalysisModel = {
      create: jest.fn(),
    };

    mockDocsReportModel = {
      create: jest.fn(),
    };

    mockCodeReportModel = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoDBAdapter,
        {
          provide: getModelToken(GitCredential.name, 'DatabaseConnection'),
          useValue: mockModel,
        },
        {
          provide: getModelToken(GitHubAnalysisRecord.name, 'DatabaseConnection'),
          useValue: mockAnalysisModel,
        },
        {
          provide: getModelToken(DocumentationReport.name, 'DatabaseConnection'),
          useValue: mockDocsReportModel,
        },
        {
          provide: getModelToken(CodeReport.name, 'DatabaseConnection'),
          useValue: mockCodeReportModel,
        },
      ],
    }).compile();

    adapter = module.get<MongoDBAdapter>(MongoDBAdapter);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(MongoDBAdapter);
    });
  });

  describe('authorize', () => {
    const mockRequest = new GetGitCredentialRequest(
      RepoURL.create('https://github.com/owner/repo'),
      PATPassword.create(VALID_PASSWORD),
    );

    it('should return a successful response when credentials are found', async () => {
      const mockDbResult = {
        patToken: 'ghp_' + 'B'.repeat(36),
        password: VALID_PASSWORD,
      } as GitCredential;

      mockQuery.exec.mockResolvedValue(mockDbResult);

      const result = await adapter.authorize(mockRequest);

      expect(result.patToken).toBe('ghp_' + 'B'.repeat(36));
      expect(mockModel.findOne).toHaveBeenCalledWith({
        repoUrl: mockRequest.repoUrl.value,
      });
    });

    it('should return a bad response when credentials are found with wrong password', async () => {
      const mockDbResult = {
        patToken: 'ghp_' + 'B'.repeat(36),
        password: 'wrong_password',
      } as GitCredential;

      mockQuery.exec.mockResolvedValue(mockDbResult);

      const result = await adapter.authorize(mockRequest);

      expect(result.patToken).toBe(null);
      expect(result.errorMessage).toBe('Wrong password');
      expect(mockModel.findOne).toHaveBeenCalledWith({
        repoUrl: mockRequest.repoUrl.value,
      });
    });

    it('should return unauthorized response when credentials are not found', async () => {
      mockQuery.exec.mockResolvedValue(null);

      const result = await adapter.authorize(mockRequest);

      expect(result.isAuthorized).toBe(false);
      expect(result.patToken).toBeNull();
      expect(result.errorMessage).toBe('Credential not found for the specified repository URL');
    });

    it('should return error response when database throws an exception', async () => {
      const dbError = new Error('Connection timeout');
      mockQuery.exec.mockRejectedValue(dbError);

      const result = await adapter.authorize(mockRequest);

      expect(result.isAuthorized).toBe(false);
      expect(result.errorMessage).toContain('Connection error database: Connection timeout');
    });
  });

  describe('save', () => {
    const mockSaveRequest = new PostGitCredentialRequest(
      RepoURL.create('https://github.com/owner/new-repo'),
      PATPassword.create(VALID_PASSWORD),
      PersonalAccessToken.create(VALID_PAT),
    );

    it('should return success when credential is saved correctly', async () => {
      mockModel.create.mockResolvedValue({
        repoUrl: mockSaveRequest.repoUrl.value,
      });

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockModel.create).toHaveBeenCalledWith({
        repoUrl: mockSaveRequest.repoUrl.value,
        password: mockSaveRequest.password.value,
        patToken: mockSaveRequest.pat.value,
      });
    });

    it('should return failure when a duplicate key error (11000) occurs', async () => {
      const mongoError = new Error('Duplicate key') as MongoError;
      mongoError.code = 11000;
      mockModel.create.mockRejectedValue(mongoError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain(
        'Credentials for repository https://github.com/owner/new-repo already exist.',
      );
    });

    it('should return failure for generic database errors', async () => {
      const genericError = new Error('Database connection lost');
      mockModel.create.mockRejectedValue(genericError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Database connection lost');
    });

    it('should return failure when password format violates schema validation', async () => {
      const validationError = new Error('ValidationError: password: Path `password` is invalid');
      validationError.name = 'ValidationError';
      mockModel.create.mockRejectedValue(validationError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('ValidationError');
    });

    it('should handle standard Error objects and return their message', async () => {
      const standardError = new Error('Database connection failed');
      mockModel.create.mockRejectedValue(standardError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Database connection failed');
    });

    it('should handle non-Error objects and return a default unknown error message', async () => {
      mockModel.create.mockRejectedValue('Stringa di errore brutale');

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Unknown error');
    });
  });

  describe('deletePAT', () => {
    const mockDeleteRequest = new DeleteGitCredentialRequest(
      RepoURL.create('https://github.com/owner/repo'),
      PATPassword.create(VALID_PASSWORD),
    );

    it('should return success when credential is deleted correctly', async () => {
      mockModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await adapter.deletePAT(mockDeleteRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockModel.deleteOne).toHaveBeenCalledWith({
        repoUrl: mockDeleteRequest.repoUrl.value,
        password: mockDeleteRequest.patPassword.value,
      });
    });

    it('should return success even when no document matched (deleteOne is idempotent)', async () => {
      mockModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await adapter.deletePAT(mockDeleteRequest);

      expect(result.isSuccess).toBe(true);
    });

    it('should call deleteOne with the correct filter', async () => {
      mockModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await adapter.deletePAT(mockDeleteRequest);

      expect(mockModel.deleteOne).toHaveBeenCalledTimes(1);
      expect(mockModel.deleteOne).toHaveBeenCalledWith({
        repoUrl: mockDeleteRequest.repoUrl.value,
        password: mockDeleteRequest.patPassword.value,
      });
    });

    it('should return failure when database throws an exception', async () => {
      const dbError = new Error('Connection timeout');
      mockModel.deleteOne.mockRejectedValue(dbError);

      const result = await adapter.deletePAT(mockDeleteRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Connection to database failed');
      expect(result.errorMessage).toContain('Connection timeout');
    });

    it('should return failure for generic database errors', async () => {
      const genericError = new Error('Replica set not reachable');
      mockModel.deleteOne.mockRejectedValue(genericError);

      const result = await adapter.deletePAT(mockDeleteRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Replica set not reachable');
    });
  });

  describe('updatePAT', () => {
    const mockUpdateRequest = new UpdateGitCredentialPatRequest(
      RepoURL.create('https://github.com/owner/repo'),
      PATPassword.create(VALID_PASSWORD),
      PersonalAccessToken.create(VALID_PAT),
    );

    it('should return success when PAT is updated correctly', async () => {
      mockModel.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(true);
    });

    it('should call updateOne with the correct filter and update payload', async () => {
      mockModel.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      await adapter.updatePAT(mockUpdateRequest);

      expect(mockModel.updateOne).toHaveBeenCalledTimes(1);
      expect(mockModel.updateOne).toHaveBeenCalledWith(
        {
          repoUrl: mockUpdateRequest.repoUrl.value,
          password: mockUpdateRequest.patPassword.value,
        },
        { patToken: mockUpdateRequest.newPat.value },
      );
    });

    it('should return failure when no document matched (wrong repoUrl or password)', async () => {
      mockModel.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toBe('Credentials not found or incorrect password');
    });

    it('should return success when document matched but PAT was already identical (modifiedCount 0)', async () => {
      mockModel.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(true);
    });

    it('should return failure when database throws an exception', async () => {
      const dbError = new Error('Write conflict');
      mockModel.updateOne.mockRejectedValue(dbError);

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Error updating token');
      expect(result.errorMessage).toContain('Write conflict');
    });

    it('should return failure for generic database errors', async () => {
      const genericError = new Error('Timeout exceeded');
      mockModel.updateOne.mockRejectedValue(genericError);

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Timeout exceeded');
    });
  });

  describe('saveAnalysis', () => {
    const reportId = ReportId.create(uuid());
    const mockRequest = new SaveGitHubAnalysisRequest(
      AnalysisId.create(uuid()),
      UserId.create(uuid()),
      RepoURL.create('https://github.com/owner/repo'),
      BranchName.create('main'),
      CommitHash.create('a'.repeat(40)),
      AnalysisStatus.PENDING,
      reportId,
      null,
      null,
    );

    it('should return success when analysis is saved correctly', async () => {
      mockAnalysisModel.create.mockResolvedValue({});

      const result = await adapter.saveAnalysis(mockRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockAnalysisModel.create).toHaveBeenCalledWith({
        analysisId: mockRequest.analysisId.value,
        userId: mockRequest.userId.value,
        repoURL: mockRequest.repoURL.value,
        branch: mockRequest.branch.value,
        commit: mockRequest.commit.value,
        status: mockRequest.status,
        codeReportId: reportId.value,
        docsReportId: null,
        securityReportId: null,
      });
    });

    it('should return failure for generic database errors', async () => {
      mockAnalysisModel.create.mockRejectedValue(new Error('Connection lost'));

      const result = await adapter.saveAnalysis(mockRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Connection lost');
    });

    it('should return failure when a non-Error object is thrown', async () => {
      mockAnalysisModel.create.mockRejectedValue('error string');

      const result = await adapter.saveAnalysis(mockRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Unknown error');
    });

    it('should return failure with correct message prefix', async () => {
      mockAnalysisModel.create.mockRejectedValue(new Error('Timeout'));

      const result = await adapter.saveAnalysis(mockRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Error saving analysis');
      expect(result.errorMessage).toContain('Timeout');
    });
  });

  describe('saveDocsReport', () => {
    const buildDocsRequest = (withDependencyAudit: boolean) => {
      const dependencyAudit = withDependencyAudit
        ? {
            getReadmeDefined: jest.fn().mockReturnValue([
              {
                getName: jest.fn().mockReturnValue('nestjs'),
                getVersionClaimed: jest.fn().mockReturnValue('10.0.0'),
              },
            ]),
            getConfigDefined: jest.fn().mockReturnValue([
              {
                getName: jest.fn().mockReturnValue('nestjs'),
                getVersionPinned: jest.fn().mockReturnValue('10.0.1'),
                getPathFinding: jest.fn().mockReturnValue({ value: 'package.json' }),
              },
            ]),
            getMissingInConfig: jest.fn().mockReturnValue([
              {
                getName: jest.fn().mockReturnValue('rxjs'),
                getPathFinding: jest.fn().mockReturnValue({ value: 'README.md' }),
                getSeverityFinding: jest.fn().mockReturnValue({ value: 'MEDIUM' }),
              },
            ]),
            getUndocumentedInReadme: jest.fn().mockReturnValue([
              {
                getName: jest.fn().mockReturnValue('class-validator'),
                getPathFinding: jest.fn().mockReturnValue({ value: 'package.json' }),
              },
            ]),
            getVersionMismatches: jest.fn().mockReturnValue([
              {
                getName: jest.fn().mockReturnValue('typescript'),
                getReadmeVersion: jest.fn().mockReturnValue('5.5.0'),
                getConfigVersion: jest.fn().mockReturnValue('5.6.2'),
                getPathFinding: jest.fn().mockReturnValue({ value: 'package.json' }),
              },
            ]),
          }
        : null;

      return {
        reportId: { value: uuid() },
        analysisId: { value: uuid() },
        apiViolations: [
          {
            getPathFinding: jest.fn().mockReturnValue({ value: '/openapi.yaml' }),
            getRule: jest.fn().mockReturnValue('operation-operationId'),
            getSeverityFinding: jest.fn().mockReturnValue({ value: 'HIGH' }),
            getDescriptionFinding: jest
              .fn()
              .mockReturnValue({ value: 'operationId is missing for one endpoint' }),
          },
        ],
        docsDiscrepancies: [
          {
            getPathFinding: jest.fn().mockReturnValue({ value: '/README.md' }),
            getDiscrepancyCategory: jest.fn().mockReturnValue('OUTDATED_DOCS'),
            getSeverityFinding: jest.fn().mockReturnValue({ value: 'LOW' }),
            getDocsClaim: jest.fn().mockReturnValue({ value: 'Uses Node 20' }),
            getActualFinding: jest.fn().mockReturnValue({ value: 'CI uses Node 22' }),
          },
        ],
        missingFiles: [
          {
            getReferencedPath: jest.fn().mockReturnValue({ value: '/docs/api.md' }),
            getReferencedIn: jest.fn().mockReturnValue({ value: '/README.md' }),
            getDescriptionFinding: jest.fn().mockReturnValue({ value: 'Referenced but missing' }),
            getStatusMissing: jest.fn().mockReturnValue('NOT_FOUND'),
          },
        ],
        dependencyAudit,
      };
    };

    it('should return success and persist full mapped payload when dependencyAudit is present', async () => {
      const request = buildDocsRequest(true);
      mockDocsReportModel.create.mockResolvedValue({});

      const result = await adapter.saveDocsReport(request as never);

      expect(result.isSuccess).toBe(true);
      expect(mockDocsReportModel.create).toHaveBeenCalledTimes(1);
      expect(mockDocsReportModel.create).toHaveBeenCalledWith({
        reportId: request.reportId.value,
        analysisId: request.analysisId.value,
        apiViolations: [
          {
            path: '/openapi.yaml',
            rule: 'operation-operationId',
            severity: 'HIGH',
            description: 'operationId is missing for one endpoint',
          },
        ],
        docsDiscrepancies: [
          {
            path: '/README.md',
            discrepancyCategory: 'OUTDATED_DOCS',
            severity: 'LOW',
            docsClaim: 'Uses Node 20',
            actualFinding: 'CI uses Node 22',
          },
        ],
        missingFiles: [
          {
            referencedPath: '/docs/api.md',
            referencedIn: '/README.md',
            description: 'Referenced but missing',
            status: 'NOT_FOUND',
          },
        ],
        dependencyAudit: {
          readmeDefined: [{ name: 'nestjs', versionClaimed: '10.0.0' }],
          configDefined: [{ name: 'nestjs', versionPinned: '10.0.1', path: 'package.json' }],
          missingInConfig: [{ name: 'rxjs', path: 'README.md', severity: 'MEDIUM' }],
          undocumentedInReadme: [{ name: 'class-validator', path: 'package.json' }],
          versionMismatches: [
            {
              name: 'typescript',
              readmeVersion: '5.5.0',
              configVersion: '5.6.2',
              path: 'package.json',
            },
          ],
        },
      });
    });

    it('should persist dependencyAudit as null when not provided', async () => {
      const request = buildDocsRequest(false);
      mockDocsReportModel.create.mockResolvedValue({});

      const result = await adapter.saveDocsReport(request as never);

      expect(result.isSuccess).toBe(true);
      expect(mockDocsReportModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ dependencyAudit: null }),
      );
    });

    it('should return failure message for Error thrown by persistence', async () => {
      const request = buildDocsRequest(true);
      mockDocsReportModel.create.mockRejectedValue(new Error('docs write failed'));

      const result = await adapter.saveDocsReport(request as never);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('docs write failed');
    });

    it('should return unknown error message for non-Error thrown by persistence', async () => {
      const request = buildDocsRequest(true);
      mockDocsReportModel.create.mockRejectedValue('random failure');

      const result = await adapter.saveDocsReport(request as never);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toBe('Unknown error during Documentation Report save');
    });
  });

  describe('saveCodeReport', () => {
    const buildCodeReportRequest = () => {
      return {
        reportId: { value: uuid() },
        analysisId: { value: uuid() },

        codeAgentMetadata: {
          language: 'javascript/typescript',
          status: 'success',
        },

        aiInterpretation: {
          verdict: 'Poor',
          executiveSummary: { value: 'Codebase has 265 static analysis issues.' },

          staticAnalysisEvaluation: {
            totalIssuesAnalyzed: 265,
            keyIssuesReasoning: [
              {
                file: { value: 'src/analysis/application/services/start-analysis.as.ts' },
                location: { lineStart: 54, lineEnd: 54, column: 16 },
                rule: 'lint/suspicious/useIterableCallbackReturn',
                severity: { value: 'high' },
                originalDescription: {
                  value: 'This callback passed to forEach() should not return a value.',
                },
                aiReasoning: { value: 'Returning values inside forEach is a common anti-pattern.' },
                suggestedResolution: { value: 'Replace forEach with map, filter, or for-of.' },
              },
            ],
          },

          coverageEvaluation: {
            overallHealth: 'Poor',
            criticalFilesReasoning: [
              {
                file: {
                  value: 'src/analysis/presentation/controllers/pat-controller.controller.ts',
                },
                lineCoveragePct: { value: 100 },
                missingLines: [],
                missingBranches: 6,
                aiReasoning: { value: 'Despite full line coverage, 6 branches are untested.' },
              },
            ],
          },
        },
      };
    };

    it('should return success and persist the full mapped payload', async () => {
      const request = buildCodeReportRequest();
      mockCodeReportModel.create.mockResolvedValue({});

      const result = await adapter.saveCodeReport(request as never);

      expect(result.isSuccess).toBe(true);
      expect(mockCodeReportModel.create).toHaveBeenCalledTimes(1);
      expect(mockCodeReportModel.create).toHaveBeenCalledWith({
        reportId: request.reportId.value,
        analysisId: request.analysisId.value,

        metadata: {
          language: 'javascript/typescript',
          status: 'success',
        },

        interpretation: {
          verdict: 'Poor',
          executiveSummary: 'Codebase has 265 static analysis issues.',

          staticAnalysisEvaluation: {
            totalIssuesAnalyzed: 265,
            keyIssuesReasoning: [
              {
                file: 'src/analysis/application/services/start-analysis.as.ts',
                location: { lineStart: 54, lineEnd: 54, column: 16 },
                rule: 'lint/suspicious/useIterableCallbackReturn',
                severity: 'high',
                originalDescription: 'This callback passed to forEach() should not return a value.',
                aiReasoning: 'Returning values inside forEach is a common anti-pattern.',
                suggestedResolution: 'Replace forEach with map, filter, or for-of.',
              },
            ],
          },

          coverageEvaluation: {
            overallHealth: 'Poor',
            criticalFilesReasoning: [
              {
                file: 'src/analysis/presentation/controllers/pat-controller.controller.ts',
                lineCoveragePct: 100,
                missingLines: [],
                missingBranches: 6,
                aiReasoning: 'Despite full line coverage, 6 branches are untested.',
              },
            ],
          },
        },
      });
    });

    it('should return failure message for Error thrown by persistence', async () => {
      const request = buildCodeReportRequest();
      mockCodeReportModel.create.mockRejectedValue(new Error('code report write failed'));

      const result = await adapter.saveCodeReport(request as never);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('code report write failed');
    });

    it('should return unknown error message for non-Error thrown by persistence', async () => {
      const request = buildCodeReportRequest();
      mockCodeReportModel.create.mockRejectedValue('random failure');

      const result = await adapter.saveCodeReport(request as never);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toBe('Unknown error during Code Report save');
    });
  });
});
