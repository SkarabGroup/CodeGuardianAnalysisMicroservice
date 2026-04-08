import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisOrchestratorService } from '../../../../src/analysis/application/services/analysis-orchestrator-service.as';
import { GitHubAnalysis } from '../../../../src/analysis/domain/entities/github-analysis.entity';

describe('AnalysisOrchestratorService', () => {
  let service: AnalysisOrchestratorService;

  // Mock tipizzato per evitare 'any' o casting fragili
  const mockAnalysis = {
    getAnalysisId: jest.fn().mockReturnValue({ value: 'test-id' }),
  } as unknown as GitHubAnalysis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisOrchestratorService],
    }).compile();

    service = module.get<AnalysisOrchestratorService>(AnalysisOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start orchestration and log success', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    service.analyze(mockAnalysis, '/tmp/repo', true, false, true);

    // Avanzamento dell'event loop per gestire la promessa staccata
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analysis started for: test-id, /tmp/repo.'),
    );

    consoleSpy.mockRestore();
  });

  it('should catch and log errors from orchestrateAnalysis', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorInstance = new Error('AI Failure');

    // Spy sul metodo privato per forzare il fallimento
    // 'as never' permette di accedere al metodo privato senza disabilitare il linter globalmente
    jest.spyOn(service as never, 'orchestrateAnalysis').mockRejectedValue(errorInstance);

    service.analyze(mockAnalysis, '/path', true, true, true);

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    // Verifica che il catch logghi esattamente l'errore catturato
    expect(consoleErrorSpy).toHaveBeenCalledWith('AI Orchestration failed:', errorInstance);

    consoleErrorSpy.mockRestore();
  });
});
