import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'node:fs/promises';
import { AnalysisOrchestratorService } from '../../../../src/analysis/application/services/analysis-orchestrator-service.as';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { DOCS_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/docs-agent.adapter';
import { CODE_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/local-code-agent.adapter';
import { REPORT_ENTITIES_PROVIDER } from '../../../../src/analysis/domain/services/report-entities-provider.ds';
import {
  DOCS_REPORT_SAVE_PORT,
  ADD_REPORTS_TO_ANALYSIS_PORT,
} from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';

// Mock dei file system
jest.mock('node:fs/promises');

describe('AnalysisOrchestratorService', () => {
  let service: AnalysisOrchestratorService;

  const codeAgentMock = { runAnalysis: jest.fn() };
  const docsAgentMock = { runAnalysis: jest.fn() };
  const reportEntitiesProviderMock = { fromDocsAgentResponse: jest.fn() };
  const docsReportSavePortMock = { saveDocsReport: jest.fn() };
  const updateAnalysisPortMock = { addReportsToAnalysis: jest.fn() };

  const mockAnalysisId = { value: 'test-uuid' };
  const mockAnalysis = {
    getAnalysisId: jest.fn().mockReturnValue(mockAnalysisId),
  } as unknown as GitHubAnalysis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisOrchestratorService,
        { provide: CODE_AGENT, useValue: codeAgentMock },
        { provide: DOCS_AGENT, useValue: docsAgentMock },
        { provide: REPORT_ENTITIES_PROVIDER, useValue: reportEntitiesProviderMock },
        { provide: DOCS_REPORT_SAVE_PORT, useValue: docsReportSavePortMock },
        { provide: ADD_REPORTS_TO_ANALYSIS_PORT, useValue: updateAnalysisPortMock },
      ],
    }).compile();

    service = module.get<AnalysisOrchestratorService>(AnalysisOrchestratorService);

    // Setup di default per i mock
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    updateAnalysisPortMock.addReportsToAnalysis.mockResolvedValue({ success: true });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyze - Code Analysis Flow', () => {
    it('should call code agent and write local file when code analysis is requested', async () => {
      codeAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'success' } },
      });

      service.analyze(mockAnalysis, '/tmp/repo', true, false, false);

      // Aspettiamo che le promesse interne si risolvano (essendo analyze void)
      await new Promise((resolve) => setImmediate(resolve));

      expect(codeAgentMock.runAnalysis).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('code_analysis_report_test-uuid.json'),
        expect.any(String),
        'utf-8',
      );
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
      reportEntitiesProviderMock.fromDocsAgentResponse.mockReturnValue(mockEntity);

      service.analyze(mockAnalysis, '/tmp/repo', false, true, false);

      await new Promise((resolve) => setImmediate(resolve));

      // Verifica trasformazione in Entity e salvataggio
      expect(reportEntitiesProviderMock.fromDocsAgentResponse).toHaveBeenCalled();
      expect(docsReportSavePortMock.saveDocsReport).toHaveBeenCalled();

      // Verifica aggiornamento dell'analisi principale con i nuovi report IDs
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
      await new Promise((resolve) => setImmediate(resolve));

      expect(docsReportSavePortMock.saveDocsReport).not.toHaveBeenCalled();
    });
  });

  describe('analyze - Error Handling & Orchestration', () => {
    it('should log error when updateAnalysisPort fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      codeAgentMock.runAnalysis.mockResolvedValue({
        analysis_report: { metadata: { status: 'success' } },
      });
      updateAnalysisPortMock.addReportsToAnalysis.mockResolvedValue({
        success: false,
        message: 'DB Error',
      });

      service.analyze(mockAnalysis, '/tmp/repo', true, false, false);
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to add reports to analysis: DB Error'),
      );
    });

    it('should handle general orchestration failure (catch block)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      // Forziamo un errore immediato
      docsAgentMock.runAnalysis.mockRejectedValue(new Error('Fatal Agent Error'));

      service.analyze(mockAnalysis, '/tmp/repo', false, true, false);
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleErrorSpy).toHaveBeenCalledWith('AI Orchestration failed:', expect.any(Error));
    });

    it('should do nothing if no tasks are selected', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      service.analyze(mockAnalysis, '/tmp/repo', false, false, false);
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Neither one of the topic of the analysis was selected',
      );
      expect(updateAnalysisPortMock.addReportsToAnalysis).not.toHaveBeenCalled();
    });
  });
});
