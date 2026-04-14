import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'node:fs/promises';
import { AnalysisOrchestratorService } from '../../../../src/analysis/application/services/analysis-orchestrator-service.as';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { DOCS_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/docs-agent.adapter';
import { CODE_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/local-code-agent.adapter';
import { ConfigurationService } from '../../../../src/analysis/infrastructure/configuration/configuration.service';
import { REPORT_ENTITIES_PROVIDER } from '../../../../src/analysis/domain/services/report-entities-provider.ds';
import { DOCS_REPORT_SAVE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';

jest.mock('node:fs/promises');

describe('AnalysisOrchestratorService', () => {
  let service: AnalysisOrchestratorService;

  const codeAgentMock = {
    runAnalysis: jest.fn(),
  };

  const docsAgentMock = {
    runAnalysis: jest.fn(),
  };

  const reportEntitiesProviderMock = {
    fromDocsAgentResponse: jest.fn(),
  };

  const docsReportSavePortMock = {
    saveDocsReport: jest.fn(),
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
          provide: REPORT_ENTITIES_PROVIDER,
          useValue: reportEntitiesProviderMock,
        },
        {
          provide: DOCS_REPORT_SAVE_PORT,
          useValue: docsReportSavePortMock,
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

  it('should start orchestration, call code agent and write report', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    codeAgentMock.runAnalysis.mockResolvedValue({
      metadata: { status: 'success' },
      ai_interpretation: { verdict: 'Safe' },
    });

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
      expect.stringContaining('analysis_report_test-id.json'),
      expect.any(String),
      'utf-8',
    );

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
});
