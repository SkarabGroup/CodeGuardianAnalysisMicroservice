import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisOrchestratorService } from '../../../../src/analysis/application/services/analysis-orchestrator-service.as';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { CODE_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/local-code-agent.adapter';
import { ConfigurationService } from '../../../../src/analysis/infrastructure/configuration/configuration.service';

describe('AnalysisOrchestratorService', () => {
  let service: AnalysisOrchestratorService;

  // Mock dell'adapter
  const codeAgentMock = {
    runAnalysis: jest.fn(),
  };

  // Mock del ConfigurationService (nel caso l'orchestratore lo usi in futuro o per coerenza)
  const mockConfigService = {
    codeAgentModel: 'test-model',
  };

  // Mock tipizzato per evitare 'any'
  const mockAnalysisId = { value: 'test-id' };
  const mockAnalysis = {
    getAnalysisId: jest.fn().mockReturnValue(mockAnalysisId),
  } as unknown as GitHubAnalysis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisOrchestratorService,
        {
          provide: CODE_AGENT,
          useValue: codeAgentMock,
        },
        {
          provide: ConfigurationService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AnalysisOrchestratorService>(AnalysisOrchestratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start orchestration and log success', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      /* noop */
    });

    // Mock di una risposta valida dell'agente
    codeAgentMock.runAnalysis.mockResolvedValue({
      metadata: { status: 'success' },
      ai_interpretation: { verdict: 'Safe' },
    });

    // Chiamata al metodo analyze
    service.analyze(mockAnalysis, '/tmp/repo', true, false, true);

    // Poiché analyze è fire-and-forget, dobbiamo attendere il ciclo di eventi
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analysis started for: test-id, /tmp/repo.'),
    );

    // Verifichiamo che l'adapter sia stato chiamato con l'oggetto richiesta corretto
    expect(codeAgentMock.runAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockAnalysisId,
      }),
    );

    consoleSpy.mockRestore();
  });

  it('should catch and log errors from orchestrateAnalysis', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });
    const errorInstance = new Error('AI Failure');

    // Spy sul metodo privato senza 'any' usando record per accedere ai membri privati
    const serviceInternal = service as unknown as {
      orchestrateAnalysis: (...args: unknown[]) => Promise<void>;
    };

    jest.spyOn(serviceInternal, 'orchestrateAnalysis').mockRejectedValue(errorInstance);

    service.analyze(mockAnalysis, '/path', true, true, true);

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('AI Orchestration failed:', errorInstance);

    consoleErrorSpy.mockRestore();
  });

  it('should log a message when no analysis topics are selected (else branch coverage)', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      /* noop */
    });

    // Chiamata con code = false
    service.analyze(mockAnalysis, '/tmp/repo', false, false, false);

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    // Verifichiamo il log del ramo else
    expect(consoleSpy).toHaveBeenCalledWith(
      'Neither one of the topic of the analysis was selected',
    );

    // Verifichiamo che l'adapter AI NON sia stato chiamato
    expect(codeAgentMock.runAnalysis).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
