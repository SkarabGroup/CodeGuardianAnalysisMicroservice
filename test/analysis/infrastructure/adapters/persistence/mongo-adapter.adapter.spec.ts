import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GitCredential } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/github-repo-credentials.schema';
import {
  MongoDBAdapter,
  MongoDeleteResult,
} from '../../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
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
import { SaveDocsReportRequest } from '../../../../../src/analysis/application/DTOs/models/requests/save-docs-report-request-model.model';
import { CodeReport } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/code-report.schema';
import { AddReportsToAnalysisRequest } from '../../../../../src/analysis/application/DTOs/models/requests/add-reports-request-model.model';
import { DeleteRepositoryCollectionRequest } from '../../../../../src/analysis/application/DTOs/models/requests/delete-repository-collection-request.model';
import { GetRepositoryCollectionRequest } from '../../../../../src/analysis/application/DTOs/models/requests/get-repository-collection-request.model';
import { GitHubCollection } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/github-collection.schema';
import { CheckCollectionDuplicateRequest } from '../../../../../src/analysis/application/DTOs/models/requests/check-collection-duplicate-request.model';
import { AddRepositoryCollectionRequest } from '../../../../../src/analysis/application/DTOs/models/requests/add-repository-collection-request.model';

// --- Mock Interfaces ---

interface MockQuery {
  lean: jest.Mock<MockQuery, []>;
  exec: jest.Mock<Promise<unknown>, []>;
  populate: jest.Mock<MockQuery, [string, string?]>;
}

interface MockModel {
  findOne: jest.Mock<MockQuery, [Record<string, unknown>]>;
  find: jest.Mock<MockQuery, [Record<string, unknown>]>;
  create: jest.Mock<Promise<unknown>, [unknown]>;
  deleteOne: jest.Mock<unknown, [Record<string, unknown>]>;
  updateOne: jest.Mock<Promise<unknown>, [Record<string, unknown>, unknown]>;
  exists: jest.Mock<Promise<unknown>, [Record<string, unknown>]>;
}

interface MongoError extends Error {
  code: number;
}

const createCustomQuery = (resolveValue: unknown, isRejected = false): MockQuery => {
  const query = {
    lean: jest.fn<MockQuery, []>(),
    exec: isRejected
      ? jest.fn<Promise<unknown>, []>().mockRejectedValue(resolveValue)
      : jest.fn<Promise<unknown>, []>().mockResolvedValue(resolveValue),
    populate: jest.fn<MockQuery, [string, string?]>(),
    select: jest.fn<MockQuery, [string]>(),
  };

  // Configuriamo i metodi concatenabili per restituire l'oggetto query stesso
  query.lean.mockReturnThis();
  query.populate.mockReturnThis();
  query.select.mockReturnThis();

  return query;
};

const VALID_PASSWORD = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const VALID_PAT = 'ghp_' + 'A'.repeat(36);

describe('MongoDBAdapter (Unit Test)', () => {
  let adapter: MongoDBAdapter;
  let mockQuery: MockQuery;
  let mockCredentialModel: MockModel;
  let mockAnalysisModel: MockModel;
  let mockDocsReportModel: MockModel;
  let mockCodeReportModel: MockModel;
  let mockCollectionModel: MockModel;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Shared chainable query mock
    mockQuery = {
      lean: jest.fn().mockReturnThis() as jest.Mock<MockQuery, []>,
      exec: jest.fn() as jest.Mock<Promise<unknown>, []>,
      populate: jest.fn().mockReturnThis() as jest.Mock<MockQuery, [string, string?]>,
    };

    // Factory to create consistent model mocks
    const createMockModel = (): MockModel => ({
      findOne: jest.fn().mockReturnValue(mockQuery) as jest.Mock<
        MockQuery,
        [Record<string, unknown>]
      >,
      find: jest.fn().mockReturnValue(mockQuery) as jest.Mock<MockQuery, [Record<string, unknown>]>,
      create: jest.fn() as jest.Mock<Promise<unknown>, [unknown]>,
      deleteOne: jest.fn() as jest.Mock<unknown, [Record<string, unknown>]>,
      updateOne: jest.fn() as jest.Mock<Promise<unknown>, [Record<string, unknown>, unknown]>,
      exists: jest.fn() as jest.Mock<Promise<unknown>, [Record<string, unknown>]>,
    });

    mockCredentialModel = createMockModel();
    mockAnalysisModel = createMockModel();
    mockDocsReportModel = createMockModel();
    mockCodeReportModel = createMockModel();
    mockCollectionModel = createMockModel();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoDBAdapter,
        {
          provide: getModelToken(GitCredential.name, 'DatabaseConnection'),
          useValue: mockCredentialModel,
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
        {
          provide: getModelToken(GitHubCollection.name, 'DatabaseConnection'),
          useValue: mockCollectionModel,
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
      expect(mockCredentialModel.findOne.mock.calls[0][0]).toEqual({
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
      expect(mockCredentialModel.findOne.mock.calls.length).toBe(1);
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
      mockCredentialModel.create.mockResolvedValue({
        repoUrl: mockSaveRequest.repoUrl.value,
      });

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockCredentialModel.create.mock.calls[0][0]).toEqual({
        repoUrl: mockSaveRequest.repoUrl.value,
        password: mockSaveRequest.password.value,
        patToken: mockSaveRequest.pat.value,
      });
    });

    it('should return failure when a duplicate key error (11000) occurs', async () => {
      const mongoError = new Error('Duplicate key') as MongoError;
      mongoError.code = 11000;
      mockCredentialModel.create.mockRejectedValue(mongoError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain(
        `Credentials for repository ${mockSaveRequest.repoUrl.value} already exist.`,
      );
    });

    it('should return failure for generic database errors', async () => {
      const genericError = new Error('Database connection lost');
      mockCredentialModel.create.mockRejectedValue(genericError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Database connection lost');
    });

    it('should return failure when password format violates schema validation', async () => {
      const validationError = new Error('ValidationError: password: Path `password` is invalid');
      validationError.name = 'ValidationError';
      mockCredentialModel.create.mockRejectedValue(validationError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('ValidationError');
    });

    it('should handle standard Error objects and return their message', async () => {
      const standardError = new Error('Database connection failed');
      mockCredentialModel.create.mockRejectedValue(standardError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Database connection failed');
    });

    it('should handle non-Error objects and return a default unknown error message', async () => {
      mockCredentialModel.create.mockRejectedValue('Stringa di errore brutale');

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
      mockCredentialModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await adapter.deletePAT(mockDeleteRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockCredentialModel.deleteOne.mock.calls[0][0]).toEqual({
        repoUrl: mockDeleteRequest.repoUrl.value,
        password: mockDeleteRequest.patPassword.value,
      });
    });

    it('should return success even when no document matched (deleteOne is idempotent)', async () => {
      mockCredentialModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await adapter.deletePAT(mockDeleteRequest);

      expect(result.isSuccess).toBe(true);
    });

    it('should return failure when database throws an exception', async () => {
      const dbError = new Error('Connection timeout');
      mockCredentialModel.deleteOne.mockRejectedValue(dbError);

      const result = await adapter.deletePAT(mockDeleteRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Connection to database failed');
      expect(result.errorMessage).toContain('Connection timeout');
    });
  });

  describe('updatePAT', () => {
    const mockUpdateRequest = new UpdateGitCredentialPatRequest(
      RepoURL.create('https://github.com/owner/repo'),
      PATPassword.create(VALID_PASSWORD),
      PersonalAccessToken.create(VALID_PAT),
    );

    it('should return success when PAT is updated correctly', async () => {
      mockCredentialModel.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockCredentialModel.updateOne.mock.calls.length).toBe(1);
    });

    it('should call updateOne with the correct filter and update payload', async () => {
      mockCredentialModel.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      await adapter.updatePAT(mockUpdateRequest);

      expect(mockCredentialModel.updateOne.mock.calls[0][0]).toEqual({
        repoUrl: mockUpdateRequest.repoUrl.value,
        password: mockUpdateRequest.patPassword.value,
      });
      expect(mockCredentialModel.updateOne.mock.calls[0][1]).toEqual({
        patToken: mockUpdateRequest.newPat.value,
      });
    });

    it('should return failure when no document matched (wrong repoUrl or password)', async () => {
      mockCredentialModel.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toBe('Credentials not found or incorrect password');
    });

    it('should return success when document matched but PAT was already identical (modifiedCount 0)', async () => {
      mockCredentialModel.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(true);
    });

    it('should return failure when database throws an exception', async () => {
      const dbError = new Error('Write conflict');
      mockCredentialModel.updateOne.mockRejectedValue(dbError);

      const result = await adapter.updatePAT(mockUpdateRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Error updating token');
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

    describe('saveDocsReport', () => {
      it('should return failure if the database fails to create the report', async () => {
        mockDocsReportModel.create.mockRejectedValue(new Error('Mongoose Error'));

        const emptyRequest = new SaveDocsReportRequest(
          ReportId.create(uuid()),
          AnalysisId.create(uuid()),
          [],
          [],
          [],
          null,
        );

        const result = await adapter.saveDocsReport(emptyRequest);

        expect(result.isSuccess).toBe(false);
        expect(result.errorMessage).toBe('Mongoose Error');
      });
    });

    describe('getAnalysisFromId', () => {
      const mockAnalysisUuid = uuid();
      const analysisIdVo = AnalysisId.create(mockAnalysisUuid);

      it('should return null if analysis is not found', async () => {
        const mockAnalysisModelInternal = adapter['analysisModel'];

        mockAnalysisModelInternal.findOne = jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(null),
        });

        const result = await adapter.getAnalysisFromId(analysisIdVo);
        expect(result).toBeNull();
      });

      it('should return detailed result with mapped docs report when found', async () => {
        const mockAnalysisRecord = {
          analysisId: mockAnalysisUuid,
          repoURL: 'https://github.com/test',
          status: 'completed',
          docsReportId: 'docs-rep-uuid',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockDocsReport = {
          reportId: 'docs-rep-uuid',
          apiViolations: [{ path: 'file.ts', rule: 'R1', severity: 'high', description: 'desc' }],
          docsDiscrepancies: [],
          missingFiles: [],
          dependencyAudit: {
            readmeDefined: [],
            configDefined: [],
            missingInConfig: [],
            undocumentedInReadme: [],
            versionMismatches: [],
          },
        };

        // Mock chain per AnalysisModel
        const mockAnalysisModelInternal = adapter['analysisModel'];

        mockAnalysisModelInternal.findOne = jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockAnalysisRecord),
        });

        // Mock chain per DocsReportModel
        const mockDocsModelInternal = adapter['docsReportModel'];

        mockDocsModelInternal.findOne = jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockDocsReport),
        });

        const result = await adapter.getAnalysisFromId(analysisIdVo);

        expect(result).toBeDefined();
        expect(result?.generalData.analysisId).toBe(mockAnalysisUuid);
        expect(result?.docsReport?.API_standard_violations[0].file).toBe('file.ts');
        expect(result?.docsReport?.metadata.repository).toBe('https://github.com/test');
      });

      it('should throw Error if database connection fails during fetch', async () => {
        const mockAnalysisModelInternal = adapter['analysisModel'];

        mockAnalysisModelInternal.findOne = jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockRejectedValue(new Error('Fetch failed')),
        });

        await expect(adapter.getAnalysisFromId(analysisIdVo)).rejects.toThrow(
          'Could not retrieve detailed analysis',
        );
      });
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
  describe('addReportsToAnalysis', () => {
    const mockAnalysisId = 'analysis-uuid-123';
    const mockCodeId = 'code-report-456';
    const mockDocsId = 'docs-report-789';
    const mockSecId = 'sec-report-000';

    it('should successfully update the analysis record with all report IDs', async () => {
      // 1. Arrange
      const request = new AddReportsToAnalysisRequest(
        mockAnalysisId,
        mockCodeId,
        mockDocsId,
        mockSecId,
      );

      // Mongoose updateOne restituisce un oggetto di stato (es. { matchedCount: 1 })
      mockAnalysisModel.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      // 2. Act
      const result = await adapter.addReportsToAnalysis(request);

      // 3. Assert
      expect(mockAnalysisModel.updateOne).toHaveBeenCalledWith(
        { analysisId: mockAnalysisId },
        {
          $set: {
            status: 'COMPLETED',
            codeReportId: mockCodeId,
            docsReportId: mockDocsId,
            securityReportId: mockSecId,
          },
        },
      );
      expect(result.success).toBe(true);
    });

    it('should handle partial report updates (null values)', async () => {
      // Caso in cui alcuni report non sono presenti
      const request = new AddReportsToAnalysisRequest(
        mockAnalysisId,
        mockCodeId,
        null, // No docs report
        null, // No security report
      );

      mockAnalysisModel.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await adapter.addReportsToAnalysis(request);

      expect(mockAnalysisModel.updateOne).toHaveBeenCalledWith(
        { analysisId: mockAnalysisId },
        {
          $set: {
            status: 'COMPLETED',
            codeReportId: mockCodeId,
            docsReportId: null,
            securityReportId: null,
          },
        },
      );
      expect(result.success).toBe(true);
    });

    it('should return failure with error message when update fails', async () => {
      // 1. Arrange
      const errorMessage = 'Database connection timeout';
      mockAnalysisModel.updateOne.mockRejectedValue(new Error(errorMessage));

      const request = new AddReportsToAnalysisRequest(mockAnalysisId, null, null, null);

      // 2. Act
      const result = await adapter.addReportsToAnalysis(request);

      // 3. Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(errorMessage);
    });

    it('should return generic failure message for unknown error types', async () => {
      // Simuliamo un errore che non è un'istanza di Error
      mockAnalysisModel.updateOne.mockRejectedValue('String error');

      const request = new AddReportsToAnalysisRequest(mockAnalysisId, null, null, null);

      const result = await adapter.addReportsToAnalysis(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown error during adding reports to analysis');
    });
  });
  describe('getAnalysisFromId', () => {
    // UUID v7 valido per superare la validazione del Value Object
    const validAnalysisIdStr = '018f6f8b-7b00-7000-8000-000000000000';
    const analysisIdVO = AnalysisId.create(validAnalysisIdStr);

    it('should return the analysis with the mapped docs report when both exist', async () => {
      // 1. Arrange - Mock del record dell'analisi
      const mockAnalysisRecord = {
        analysisId: validAnalysisIdStr,
        userId: 'user-123',
        repoURL: 'https://github.com/test/repo',
        branch: 'main',
        commit: 'abc1234',
        status: 'completed',
        docsReportId: 'report-999',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock del record del report (struttura DB in CamelCase)
      const mockReportDoc = {
        reportId: 'report-999',
        apiViolations: [{ path: 'file1.ts', rule: 'rule1', severity: 'high', description: 'err' }],
        docsDiscrepancies: [
          {
            discrepancyCategory: 'OUTDATED_DOCS',
            path: 'file1.ts',
            severity: 'low',
            docsClaim: 'claim',
            actualFinding: 'actual',
          },
        ],
        missingFiles: [
          {
            referencedPath: 'path1',
            referencedIn: 'file1.ts',
            description: 'missing file 1',
            status: 'NOT_FOUND',
          },
        ],
        dependencyAudit: {
          readmeDefined: [{ name: 'deps1', versionClaimed: '1.0.0' }],
          configDefined: [{ name: 'deps1', versionPinned: '1.0.1', path: 'package.json' }],
          missingInConfig: [{ name: 'deps2', path: 'README.md', severity: 'MEDIUM' }],
          undocumentedInReadme: [{ name: 'deps3', path: 'package.json' }],
          versionMismatches: [{ name: 'deps4', versionFound: '1.0.0', versionExpected: '1.0.1' }],
        },
      };

      // Configurazione dei mock per le query concatenate
      // Prima chiamata: trova l'analisi
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAnalysisRecord),
      });

      // Seconda chiamata: trova il report
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockDocsReportModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReportDoc),
      });

      // 2. Act
      const result = await adapter.getAnalysisFromId(analysisIdVO);

      // 3. Assert
      expect(result).not.toBeNull();
      expect(result?.generalData.analysisId).toBe(validAnalysisIdStr);

      // Verifica il mapping del report (da DB CamelCase a DTO SnakeCase)
      expect(result?.docsReport).toBeDefined();
      expect(result?.docsReport?.API_standard_violations[0].file).toBe('file1.ts');
      expect(result?.docsReport?.dependency_audit.readme_defined[0].name).toBe('deps1');

      // Verifica che le query siano state chiamate con i parametri corretti
      expect(mockAnalysisModel.findOne).toHaveBeenCalledWith({ analysisId: validAnalysisIdStr });
      expect(mockDocsReportModel.findOne).toHaveBeenCalledWith({ reportId: 'report-999' });
    });

    it('should return general data and null report if docsReportId is missing', async () => {
      // Record senza docsReportId
      const mockAnalysisRecord = {
        analysisId: validAnalysisIdStr,
        docsReportId: null,
        status: 'pending',
        repoURL: 'url',
        // ... altri campi
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAnalysisRecord),
      });

      const result = await adapter.getAnalysisFromId(analysisIdVO);

      expect(result?.generalData.status).toBe('pending');
      expect(result?.docsReport).toBeNull();
      // Verifica che non sia stata fatta la seconda query
      expect(mockDocsReportModel.findOne).not.toHaveBeenCalled();
    });

    it('should return general data and null report if docsReportId is present but the report is missing', async () => {
      const mockAnalysisRecord = {
        analysisId: validAnalysisIdStr,
        docsReportId: 'report-missing',
        status: 'completed',
        repoURL: 'url',
        userId: 'user-123',
        branch: 'main',
        commit: 'commit-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAnalysisRecord),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockDocsReportModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await adapter.getAnalysisFromId(analysisIdVO);

      expect(result).not.toBeNull();
      expect(result?.generalData.analysisId).toBe(validAnalysisIdStr);
      expect(result?.docsReport).toBeNull();
      expect(mockDocsReportModel.findOne).toHaveBeenCalledWith({ reportId: 'report-missing' });
    });

    it('should map an existing docs report with an empty dependency audit to empty arrays', async () => {
      const mockAnalysisRecord = {
        analysisId: validAnalysisIdStr,
        docsReportId: 'report-empty-dependencies',
        status: 'completed',
        repoURL: 'url',
        userId: 'user-123',
        branch: 'main',
        commit: 'commit-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReportDoc = {
        reportId: 'report-empty-dependencies',
        apiViolations: [],
        docsDiscrepancies: [],
        missingFiles: [],
        dependencyAudit: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAnalysisRecord),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockDocsReportModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReportDoc),
      });

      const result = await adapter.getAnalysisFromId(analysisIdVO);

      expect(result).not.toBeNull();
      expect(result?.docsReport?.dependency_audit.readme_defined).toEqual([]);
      expect(result?.docsReport?.dependency_audit.config_defined).toEqual([]);
      expect(result?.docsReport?.dependency_audit.missing_in_config).toEqual([]);
      expect(result?.docsReport?.dependency_audit.undocumented_in_readme).toEqual([]);
      expect(result?.docsReport?.dependency_audit.version_mismatches).toEqual([]);
    });

    it('should return null if the analysis record is not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await adapter.getAnalysisFromId(analysisIdVO);

      expect(result).toBeNull();
    });

    it('should throw an error if the database query fails', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB failure')),
      });

      await expect(adapter.getAnalysisFromId(analysisIdVO)).rejects.toThrow(
        'Could not retrieve detailed analysis',
      );
    });
    it('should have 100% coverage by mapping all nested arrays', async () => {
      const mockReportDoc = {
        reportId: 'report-999',
        // Popola OGNI array con almeno un oggetto
        apiViolations: [{ path: 'f.ts', rule: 'r', severity: 'h', description: 'd' }],
        docsDiscrepancies: [
          {
            discrepancyCategory: 'c',
            path: 'p',
            docsClaim: 'dc',
            actualFinding: 'af',
            severity: 's',
          },
        ],
        missingFiles: [{ referencedPath: 'rp', referencedIn: 'ri', description: 'd', status: 's' }],
        dependencyAudit: {
          readmeDefined: [{ name: 'n', versionClaimed: '1.0' }],
          configDefined: [{ name: 'n', versionPinned: '1.1', path: 'p' }],
          missingInConfig: [{ name: 'n', severity: 'h', path: 'p' }],
          undocumentedInReadme: [{ name: 'n', path: 'p' }],
          versionMismatches: [{ name: 'n', readmeVersion: '1.0', configVersion: '1.1', path: 'p' }],
        },
      };

      // Configura i mock come fatto in precedenza...
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ analysisId: '...', docsReportId: 'report-999' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockDocsReportModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReportDoc),
      });

      const result = await adapter.getAnalysisFromId(
        AnalysisId.create('018f6f8b-7b00-7000-8000-000000000000'),
      );

      // Verifica che ogni array sia stato mappato correttamente
      expect(mockDocsReportModel.findOne).toHaveBeenCalledWith({ reportId: 'report-999' });
      expect(result?.docsReport?.API_standard_violations[0].file).toBe('f.ts');
      expect(result?.docsReport?.missing_files[0].referenced_path).toBe('rp');
      expect(result?.docsReport?.dependency_audit.readme_defined[0].name).toBe('n');
    });
  });

  describe('getAllAnalysesForUser', () => {
    it('should return successfully a list of analyses for the user', async () => {
      const mockUserId = UserId.create(uuid());
      const mockAnalyses = [
        {
          analysisId: 'a1',
          userId: mockUserId.value,
          repoURL: 'http://repo1',
          branch: 'main',
          commit: 'c1',
          status: AnalysisStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAnalyses),
      });

      const result = await adapter.getAllAnalysesForUser(mockUserId);
      expect(result.dto).toHaveLength(1);
      expect(result.dto[0].analysisId).toBe('a1');
      expect(result.dto[0].repoURL).toBe('http://repo1');
      expect(mockAnalysisModel.find).toHaveBeenCalledWith({ userId: mockUserId.value });
    });

    it('should return an empty list when no analyses are found', async () => {
      const mockUserId = UserId.create(uuid());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await adapter.getAllAnalysesForUser(mockUserId);
      expect(result.dto).toHaveLength(0);
    });

    it('should throw an error with the original message when an Error is thrown', async () => {
      const mockUserId = UserId.create(uuid());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      await expect(adapter.getAllAnalysesForUser(mockUserId)).rejects.toThrow(
        'Error fetching analyses for user: Database connection failed',
      );
    });

    it('should throw an error with Unknown error when a non-Error is thrown', async () => {
      const mockUserId = UserId.create(uuid());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockAnalysisModel.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue('String error'),
      });

      await expect(adapter.getAllAnalysesForUser(mockUserId)).rejects.toThrow(
        'Error fetching analyses for user: Unknown error',
      );
    });
    describe('Collection Management Methods', () => {
      const mockUser = UserId.create(uuid());
      const mockUrl = RepoURL.create('https://github.com/owner/repo');

      describe('checkDuplicate', () => {
        it('should return true if collection exists', async () => {
          mockCollectionModel.exists.mockResolvedValue({ _id: 'some-id' });

          const request = new CheckCollectionDuplicateRequest(mockUser, mockUrl);
          const result = await adapter.checkDuplicate(request);

          expect(result.duplicate).toBe(true);
          expect(mockCollectionModel.exists.mock.calls.length).toBe(1);
        });

        it('should return false if collection does not exist', async () => {
          mockCollectionModel.exists.mockResolvedValue(null);

          const result = await adapter.checkDuplicate(
            new CheckCollectionDuplicateRequest(mockUser, mockUrl),
          );
          expect(result.duplicate).toBe(false);
        });
      });

      describe('addCollection', () => {
        it('should successfully create a collection', async () => {
          mockCollectionModel.create.mockResolvedValue({});

          const request = new AddRepositoryCollectionRequest(
            mockUser,
            mockUrl,
            'Test Name',
            'Test Desc',
          );
          const result = await adapter.addCollection(request);

          expect(result.added).toBe(true);
          expect(mockCollectionModel.create.mock.calls[0][0]).toEqual({
            userId: mockUser.value,
            url: mockUrl.value,
            name: 'Test Name',
            description: 'Test Desc',
            analyses: [],
          });
        });
      });

      describe('getRepositoryCollection', () => {
        it('should return collection with dynamically fetched analysis IDs', async () => {
          const dbCollectionResult = {
            url: mockUrl.value,
            name: 'My Collection',
            description: 'Dynamic Desc',
          };

          const dbAnalysesResult = [{ analysisId: 'dynamic-id-1' }, { analysisId: 'dynamic-id-2' }];

          // Mock della prima chiamata: findOne().lean().exec()
          mockCollectionModel.findOne.mockReturnValue(createCustomQuery(dbCollectionResult));

          // Mock della seconda chiamata: find().select().lean().exec()
          // Grazie a .mockReturnThis() nell'helper, la catena funziona automaticamente
          mockAnalysisModel.find.mockReturnValue(createCustomQuery(dbAnalysesResult));

          const request = new GetRepositoryCollectionRequest(mockUser, mockUrl);
          const result = await adapter.getRepositoryCollection(request);

          expect(result.success).toBe(true);
          expect(result.analyses).toEqual(['dynamic-id-1', 'dynamic-id-2']);

          // Verifica chiamate (usando .mock.calls per unbound-method)
          expect(mockCollectionModel.findOne.mock.calls.length).toBe(1);
          expect(mockAnalysisModel.find.mock.calls[0][0]).toEqual({
            repoURL: mockUrl.value,
            userId: mockUser.value,
          });
        });

        it('should return failure result if collection not found', async () => {
          mockCollectionModel.findOne.mockReturnValue(createCustomQuery(null));

          const result = await adapter.getRepositoryCollection(
            new GetRepositoryCollectionRequest(mockUser, mockUrl),
          );

          expect(result.success).toBe(false);
          expect(result.message).toBe('Collection not found');
          // Verifichiamo che la query sulle analisi non sia partita
          expect(mockAnalysisModel.find.mock.calls.length).toBe(0);
        });
      });

      describe('deleteCollection', () => {
        it('should return success when deletedCount is 1', async () => {
          const mongoResult: MongoDeleteResult = { acknowledged: true, deletedCount: 1 };
          // deleteOne in your adapter uses .exec(), so we mock the chain
          mockCollectionModel.deleteOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mongoResult),
          });

          const request = new DeleteRepositoryCollectionRequest(mockUser, mockUrl);
          const result = await adapter.deleteCollection(request);

          expect(result.deleted).toBe(true);
          expect(mockCollectionModel.deleteOne.mock.calls.length).toBe(1);
        });

        it('should return failure result when nothing is deleted', async () => {
          const mongoResult: MongoDeleteResult = { acknowledged: true, deletedCount: 0 };
          mockCollectionModel.deleteOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mongoResult),
          });

          const result = await adapter.deleteCollection(
            new DeleteRepositoryCollectionRequest(mockUser, mockUrl),
          );
          expect(result.deleted).toBe(false);
          expect(result.message).toBe('Collection not found');
        });
      });
    });
  });
});
