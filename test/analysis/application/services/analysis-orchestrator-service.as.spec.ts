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
} from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
jest.mock('node:fs/promises');

describe('AnalysisOrchestratorService', () => {
  let service: AnalysisOrchestratorService;

  const codeAgentMock = {
    runAnalysis: jest.fn(),
  };

  const docsAgentMock = {
    runAnalysis: jest.fn(),
  };

  const docsReportProviderMock = {
    fromDocsAgentResponse: jest.fn(),
  };

  const codeReportProviderMock = {
    fromCodeAgentResponse: jest.fn(),
  };

  const docsReportSavePortMock = {
    saveDocsReport: jest.fn(),
  };

  const codeReportSavePortMock = {
    saveCodeReport: jest.fn(),
  };

  const mockConfigService = {
    codeAgentModel: 'test-model',
  };

  const mockAnalysisId = { value: 'test-id' };
  const mockAnalysis = {
    getAnalysisId: jest.fn().mockReturnValue(mockAnalysisId),
  } as unknown as GitHubAnalysis;

  beforeEach(async () => {
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

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
      ],
    }).compile();

    service = module.get<AnalysisOrchestratorService>(AnalysisOrchestratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start orchestration, call code agent, map entity and save report', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    codeAgentMock.runAnalysis.mockResolvedValue({
      metadata: { status: 'success' },
      ai_interpretation: { verdict: 'Safe' },
    });

    const mockEntity = {
      id: { value: 'fake-id' },
      analysisId: mockAnalysisId,
      metadata: {},
      interpretation: {},
    };
    codeReportProviderMock.fromCodeAgentResponse.mockReturnValue(mockEntity);

    service.analyze(mockAnalysis, '/tmp/repo', true, false, false);

    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analysis started for: test-id, /tmp/repo.'),
    );

    expect(codeAgentMock.runAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockAnalysisId,
      }),
    );

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('code_analysis_report_test-id.json'),
      expect.any(String),
      'utf-8',
    );

    expect(codeReportProviderMock.fromCodeAgentResponse).toHaveBeenCalled();
    expect(codeReportSavePortMock.saveCodeReport).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should catch and log errors from orchestrateAnalysis', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorInstance = new Error('AI Failure');

    const serviceInternal = service as unknown as {
      orchestrateAnalysis: (...args: unknown[]) => Promise<void>;
    };

    jest.spyOn(serviceInternal, 'orchestrateAnalysis').mockRejectedValue(errorInstance);

    service.analyze(mockAnalysis, '/path', true, true, true);

    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith('AI Orchestration failed:', errorInstance);

    consoleErrorSpy.mockRestore();
  });

  it('should log a message when no analysis topics are selected', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    service.analyze(mockAnalysis, '/tmp/repo', false, false, false);

    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleSpy).toHaveBeenCalledWith(
      'Neither one of the topic of the analysis was selected',
    );

    expect(codeAgentMock.runAnalysis).not.toHaveBeenCalled();
    expect(docsAgentMock.runAnalysis).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // Added some tests AI generated to fix coverage
  it('should start orchestration, call docs agent, map entity and save report', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    docsAgentMock.runAnalysis.mockResolvedValue({
      analysis_report: { metadata: { status: 'success' } },
    });

    const mockDocsEntity = {
      getReportId: jest.fn().mockReturnValue({ value: 'docs-report-id' }),
      getAnalysisId: jest.fn().mockReturnValue(mockAnalysisId),
      getApiViolations: jest.fn().mockReturnValue([]),
      getDocsDiscrepancies: jest.fn().mockReturnValue([]),
      getMissingFiles: jest.fn().mockReturnValue([]),
      getDependencyAudit: jest.fn().mockReturnValue({}),
    };
    docsReportProviderMock.fromDocsAgentResponse.mockReturnValue(mockDocsEntity);

    service.analyze(mockAnalysis, '/tmp/repo', false, true, false);

    await new Promise((resolve) => setImmediate(resolve));

    expect(docsAgentMock.runAnalysis).toHaveBeenCalled();
    expect(docsReportProviderMock.fromDocsAgentResponse).toHaveBeenCalled();
    expect(docsReportSavePortMock.saveDocsReport).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle code agent failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    codeAgentMock.runAnalysis.mockResolvedValue({
      metadata: { status: 'failed' },
    });

    service.analyze(mockAnalysis, '/tmp/repo', true, false, false);

    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Code Agent Analysis failed'),
    );
    expect(codeReportProviderMock.fromCodeAgentResponse).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle docs agent failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    docsAgentMock.runAnalysis.mockResolvedValue({
      analysis_report: { metadata: { status: 'error' } },
    });

    service.analyze(mockAnalysis, '/tmp/repo', false, true, false);

    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Documentation Agent Analysis failed'),
    );
    expect(docsReportProviderMock.fromDocsAgentResponse).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
