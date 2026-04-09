import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisOrchestratorService } from '../../../../src/analysis/application/services/analysis-orchestrator-service.as';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';
import { CODE_AGENT } from '../../../../src/analysis/infrastructure/adapters/externals/code-agent.adapter';
describe('AnalysisOrchestratorService', () => {
  let service: AnalysisOrchestratorService;

  // Mock dell'adapter iniettato
  const codeAgentMock = {
    runAnalysis: jest.fn(),
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
          // Usiamo un oggetto che implementa l'interfaccia necessaria
          useValue: codeAgentMock,
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
    // unbound-method: usiamo una funzione anonima
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      /* noop */
    });
    codeAgentMock.runAnalysis.mockResolvedValue({ success: true });

    service.analyze(mockAnalysis, '/tmp/repo', true, false, true);

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analysis started for: test-id, /tmp/repo.'),
    );

    // Verifichiamo che l'adapter sia stato chiamato con l'ID corretto
    expect(codeAgentMock.runAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockAnalysisId,
      }),
    );

    consoleSpy.mockRestore();
  });

  it('should catch and log errors from orchestrateAnalysis', async () => {
    // unbound-method: usiamo una funzione anonima
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });
    const errorInstance = new Error('AI Failure');

    // Spy sul metodo privato senza 'any' usando record
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
});
