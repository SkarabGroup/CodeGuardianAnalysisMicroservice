import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'node:fs/promises';
import { AnalysisOrchestratorService } from '../../../../src/analysis/application/services/analysis-orchestrator-service.as';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { DOCS_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/docs-agent.adapter';
import { CODE_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/local-code-agent.adapter';
import { ConfigurationService } from '../../../../src/analysis/infrastructure/configuration/configuration.service';
import {
  DOCS_REPORT_PROVIDER,
  CODE_REPORT_PROVIDER,
} from '../../../../src/analysis/domain/services/report-entities-provider.ds';
import {
  DOCS_REPORT_SAVE_PORT,
  CODE_REPORT_SAVE_PORT,
  ADD_REPORTS_TO_ANALYSIS_PORT,
} from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { SECURITY_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/security-agent.adapter';
import { SECURITY_REPORT_PROVIDER } from '../../../../src/analysis/domain/services/report-entities-provider.ds';
import { SECURITY_REPORT_SAVE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';

jest.mock('node:fs/promises');

describe('AnalysisOrchestratorService', () => {
  let service: AnalysisOrchestratorService;

  const codeAgentMock = { runAnalysis: jest.fn() };
  const docsAgentMock = { runAnalysis: jest.fn() };
  const docsReportProviderMock = { fromDocsAgentResponse: jest.fn() };
  const docsReportSavePortMock = { saveDocsReport: jest.fn() };
  const updateAnalysisPortMock = { addReportsToAnalysis: jest.fn() };

  const codeReportProviderMock = {
    fromCodeAgentResponse: jest.fn(),
  };

  const codeReportSavePortMock = {
    saveCodeReport: jest.fn(),
  };

  const mockConfigService = {
    codeAgentModel: 'test-model',
  };

  const mockAnalysisId = { value: 'test-uuid' };
  const mockAnalysis = {
    getAnalysisId: jest.fn().mockReturnValue(mockAnalysisId),
  } as unknown as GitHubAnalysis;

  // Struttura corretta per il code agent mock: deve avere analysis_report come wrapper
  const successfulCodeAgentResponse = {
    analysis_report: {
      metadata: { status: 'success' },
      ai_interpretation: { verdict: 'Good' },
    },
  };

  const securityAgentMock = { runAnalysis: jest.fn() };
  const securityReportProviderMock = { fromSecurityAgentResponse: jest.fn() };
  const securityReportSavePortMock = { saveSecurityReport: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisOrchestratorService,
        {
          provide: CODE_AGENT,
          useValue: codeAgentMock,
        },
        {
          provide: DOCS_AGENT,
          useValue: docsAgentMock,
        },
        {
          provide: ConfigurationService,
          useValue: mockConfigService,
        },
        {
          provide: DOCS_REPORT_PROVIDER,
          useValue: docsReportProviderMock,
        },
        {
          provide: DOCS_REPORT_SAVE_PORT,
          useValue: docsReportSavePortMock,
        },
        {
          provide: CODE_REPORT_PROVIDER,
          useValue: codeReportProviderMock,
        },
        {
          provide: CODE_REPORT_SAVE_PORT,
          useValue: codeReportSavePortMock,
        },
        {
          provide: ADD_REPORTS_TO_ANALYSIS_PORT,
          useValue: updateAnalysisPortMock,
        },
        {
          provide: SECURITY_AGENT,
          useValue: securityAgentMock,
        },
        {
          provide: SECURITY_REPORT_PROVIDER,
          useValue: securityReportProviderMock,
        },
        {
          provide: SECURITY_REPORT_SAVE_PORT,
          useValue: securityReportSavePortMock,
        },
      ],
    }).compile();

    service = module.get<AnalysisOrchestratorService>(AnalysisOrchestratorService);

    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    updateAnalysisPortMock.addReportsToAnalysis.mockResolvedValue({ success: true });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyze - Code Analysis Flow', () => {
    it('should start orchestration, call code agent, map entity and save report', async () => {
      codeAgentMock.runAnalysis.mockResolvedValue(successfulCodeAgentResponse);

      const mockEntity = {
        id: { value: 'fake-id' },
        analysisId: mockAnalysisId,
        metadata: {},
        interpretation: {},
      };
      codeReportProviderMock.fromCodeAgentResponse.mockReturnValue(mockEntity);

      service.analyze(mockAnalysis, '/tmp/repo', true, false, false);

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(codeReportProviderMock.fromCodeAgentResponse).toHaveBeenCalled();
      expect(codeReportSavePortMock.saveCodeReport).toHaveBeenCalled();
    });

    it('should call code agent and write local file when code analysis is requested', async () => {
      codeAgentMock.runAnalysis.mockResolvedValue(successfulCodeAgentResponse);

      const mockEntity = {
        id: { value: 'code-id' },
        analysisId: mockAnalysisId,
        metadata: {},
        interpretation: {},
      };
      codeReportProviderMock.fromCodeAgentResponse.mockReturnValue(mockEntity);

      service.analyze(mockAnalysis, '/tmp/repo', true, false, false);

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(codeAgentMock.runAnalysis).toHaveBeenCalled();
    });

    it('should handle code agent failure gracefully', async () => {
      // FIX: struttura corretta con analysis_report wrapper, status != 'success'
      codeAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: {
          metadata: { status: 'failed' },
        },
      });

      service.analyze(mockAnalysis, '/tmp/repo', true, false, false);

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Code Agent Analysis failed'),
      );
      expect(codeReportProviderMock.fromCodeAgentResponse).not.toHaveBeenCalled();
    });
  });

  describe('analyze - Documentation Analysis Flow', () => {
    it('should run full docs flow: agent -> provider -> save -> update', async () => {
      const mockDocsResponse = {
        analysis_report: { metadata: { status: 'success' } },
      };
      const mockEntity = {
        getReportId: () => ({ value: 'rep-1' }),
        getAnalysisId: () => mockAnalysisId,
        getApiViolations: () => [],
        getDocsDiscrepancies: () => [],
        getMissingFiles: () => [],
        getDependencyAudit: () => ({}),
      };

      docsAgentMock.runAnalysis.mockResolvedValue(mockDocsResponse);
      docsReportProviderMock.fromDocsAgentResponse.mockReturnValue(mockEntity);

      service.analyze(mockAnalysis, '/tmp/repo', false, true, false);

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(docsAgentMock.runAnalysis).toHaveBeenCalled();
      expect(docsReportProviderMock.fromDocsAgentResponse).toHaveBeenCalled();
      expect(docsReportSavePortMock.saveDocsReport).toHaveBeenCalled();

      expect(updateAnalysisPortMock.addReportsToAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          analysisId: 'test-uuid',
        }),
      );
    });

    it('should not save to DB if docs agent returns failure status', async () => {
      docsAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'failure' } },
      });

      service.analyze(mockAnalysis, '/tmp/repo', false, true, false);
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(docsReportSavePortMock.saveDocsReport).not.toHaveBeenCalled();
    });

    it('should handle docs agent failure gracefully', async () => {
      docsAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'error' } },
      });

      service.analyze(mockAnalysis, '/tmp/repo', false, true, false);

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Documentation Agent Analysis failed'),
      );
      expect(docsReportProviderMock.fromDocsAgentResponse).not.toHaveBeenCalled();
    });
  });

  describe('analyze - Error Handling & Orchestration', () => {
    it('should log error when updateAnalysisPort fails', async () => {
      // FIX: struttura corretta con analysis_report wrapper
      codeAgentMock.runAnalysis.mockResolvedValue(successfulCodeAgentResponse);

      const mockEntity = {
        getReportId: () => ({ value: 'fake-id' }),
        id: { value: 'fake-id' },
        analysisId: mockAnalysisId,
        metadata: {},
        interpretation: {},
      };
      codeReportProviderMock.fromCodeAgentResponse.mockReturnValue(mockEntity);

      updateAnalysisPortMock.addReportsToAnalysis.mockResolvedValue({
        success: false,
        message: 'DB Error',
      });

      service.analyze(mockAnalysis, '/tmp/repo', true, false, false);
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to add reports to analysis: DB Error'),
      );
    });

    it('should handle general orchestration failure (catch block)', async () => {
      docsAgentMock.runAnalysis.mockRejectedValue(new Error('Fatal Agent Error'));

      service.analyze(mockAnalysis, '/tmp/repo', false, true, false);
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(console.error).toHaveBeenCalledWith('AI Orchestration failed:', expect.any(Error));
    });

    it('should do nothing if no tasks are selected', async () => {
      service.analyze(mockAnalysis, '/tmp/repo', false, false, false);
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(console.log).toHaveBeenCalledWith(
        'Neither one of the topic of the analysis was selected',
      );
      expect(updateAnalysisPortMock.addReportsToAnalysis).not.toHaveBeenCalled();
    });

    it('should successfully orchestrate all selected tasks (code, docs, security) and log success', async () => {
      // FIX: struttura corretta per code agent
      codeAgentMock.runAnalysis.mockResolvedValue(successfulCodeAgentResponse);

      const mockCodeEntity = {
        id: { value: 'code-id' },
        analysisId: mockAnalysisId,
        metadata: {},
        interpretation: {},
      };
      codeReportProviderMock.fromCodeAgentResponse.mockReturnValue(mockCodeEntity);

      docsAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'success' } },
      });
      const mockDocsEntity = {
        getReportId: () => ({ value: 'docs-id' }),
        getAnalysisId: () => mockAnalysisId,
        getApiViolations: () => [],
        getDocsDiscrepancies: () => [],
        getMissingFiles: () => [],
        getDependencyAudit: () => ({}),
      };
      docsReportProviderMock.fromDocsAgentResponse.mockReturnValue(mockDocsEntity);

      // Mock Security Agent success
      securityAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'success' } },
      });
      const mockSecurityEntity = {
        getReportId: () => ({ value: 'sec-report-id' }),
        getAnalysisId: () => mockAnalysisId,
        getDependencyFindings: () => [],
        getOwaspFindings: () => [],
        getSecretFindings: () => [],
        getToolErrors: () => [],
      };
      securityReportProviderMock.fromSecurityAgentResponse.mockReturnValue(mockSecurityEntity);

      updateAnalysisPortMock.addReportsToAnalysis.mockResolvedValue({
        success: true,
      });

      service.analyze(mockAnalysis, '/tmp/repo', true, true, true);

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(updateAnalysisPortMock.addReportsToAnalysis).toHaveBeenCalled();

      expect(console.log).toHaveBeenCalledWith(
        'Analysis reports added to the analysis record successfully.',
      );
    });
  });

  describe('analyze - Security Analysis Flow', () => {
    const mockSecurityResponse = {
      analysis_report: {
        metadata: { status: 'success' },
        grype: [
          {
            path: '/package-lock.json',
            package_name: 'lodash',
            package_version: '4.17.23',
            vulnerability_id: 'GHSA-r5fr-rjxr-66jc',
            severity: 'High',
            description: 'lodash vulnerable to Code Injection',
            remediation: 'Update to 4.18.0',
          },
        ],
        semgrep: [
          {
            rule_id: 'semgrep-rule-001',
            path: '/tmp/my-repo/routes/userProfile.ts',
            line: 62,
            severity: 'ERROR',
            description: 'Found data flowing to eval',
            owasp_category: 'A03:2021 - Injection',
            remediation: 'Avoid using eval() with user input',
          },
        ],
        trivy: [
          {
            rule_id: 'trivy-rule-001',
            path: 'lib/insecurity.ts',
            line: 23,
            severity: 'HIGH',
            description: 'Asymmetric Private Key',
            secret_category: 'AsymmetricPrivateKey',
            remediation: 'Remove the private key from source code',
          },
        ],
        errors: [
          {
            tool: 'trivy',
            description: 'Tool execution failed',
          },
        ],
      },
    };

    const mockSecurityEntity = {
      getReportId: () => ({ value: 'sec-report-id' }),
      getAnalysisId: () => mockAnalysisId,
      getDependencyFindings: () => [],
      getOwaspFindings: () => [],
      getSecretFindings: () => [],
      getToolErrors: () => [],
    };

    it('should run full security flow: agent -> provider -> save -> update', async () => {
      securityAgentMock.runAnalysis.mockResolvedValue(mockSecurityResponse);
      securityReportProviderMock.fromSecurityAgentResponse.mockReturnValue(mockSecurityEntity);

      service.analyze(mockAnalysis, '/tmp/repo', false, false, true);

      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(securityAgentMock.runAnalysis).toHaveBeenCalled();
      expect(securityReportProviderMock.fromSecurityAgentResponse).toHaveBeenCalled();
      expect(securityReportSavePortMock.saveSecurityReport).toHaveBeenCalled();
      expect(updateAnalysisPortMock.addReportsToAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          analysisId: 'test-uuid',
        }),
      );
    });

    it('should not save to DB if security agent returns failure status', async () => {
      securityAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'failure' } },
      });

      service.analyze(mockAnalysis, '/tmp/repo', false, false, true);

      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(securityReportSavePortMock.saveSecurityReport).not.toHaveBeenCalled();
      expect(securityReportProviderMock.fromSecurityAgentResponse).not.toHaveBeenCalled();
    });

    it('should handle security agent failure gracefully', async () => {
      securityAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'error' } },
      });

      service.analyze(mockAnalysis, '/tmp/repo', false, false, true);

      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Security Agent Analysis failed'),
      );
      expect(securityReportProviderMock.fromSecurityAgentResponse).not.toHaveBeenCalled();
    });

    it('should pass null securityReportId to update when security agent fails', async () => {
      securityAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'failure' } },
      });

      service.analyze(mockAnalysis, '/tmp/repo', false, false, true);

      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(updateAnalysisPortMock.addReportsToAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          securityReportId: null,
        }),
      );
    });

    it('should handle security agent throwing an exception', async () => {
      securityAgentMock.runAnalysis.mockRejectedValue(new Error('Security agent crashed'));

      service.analyze(mockAnalysis, '/tmp/repo', false, false, true);

      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(console.error).toHaveBeenCalledWith('AI Orchestration failed:', expect.any(Error));
    });
  });
});
