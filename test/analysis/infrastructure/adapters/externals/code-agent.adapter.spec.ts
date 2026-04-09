import { Test, TestingModule } from '@nestjs/testing';
import { CodeAnalysisAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/code-agent.adapter';
import { AgentRequest } from '../../../../../src/analysis/application/DTOs/models/requests/agent-request-model.model';
import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';

// Mock di child_process
jest.mock('node:child_process');

describe('CodeAnalysisAdapter', () => {
  let adapter: CodeAnalysisAdapter;
  const mockAnalysisId = { value: 'test-id-123' };
  const mockRequest = new AgentRequest(mockAnalysisId);

  // Helper per creare un mock tipizzato del processo Docker senza usare any
  const createMockProcess = (): childProcess.ChildProcess => {
    return new EventEmitter() as unknown as childProcess.ChildProcess;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeAnalysisAdapter],
    }).compile();

    adapter = module.get<CodeAnalysisAdapter>(CodeAnalysisAdapter);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('runAnalysis', () => {
    it('should successfully run docker container', async () => {
      const processMock = createMockProcess();

      // Tipizzazione dello spy per evitare @typescript-eslint/unbound-method
      const spawnSpy = jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        /* noop */
      });

      const analysisPromise = adapter.runAnalysis(mockRequest);

      // Simuliamo l'evento di chiusura con successo
      process.nextTick(() => {
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(spawnSpy).toHaveBeenCalledWith(
        'docker',
        expect.arrayContaining([
          'run',
          '--rm',
          'strands-code-analyzer',
          `/tmp/${mockAnalysisId.value}`,
        ]),
        expect.objectContaining({ stdio: 'inherit' }),
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle non-zero exit code (catch block)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      // Mocking console.error con funzione anonima per unbound-method
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        /* noop */
      });

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        processMock.emit('close', 1);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle spawn error (catch block)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        /* noop */
      });

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        processMock.emit('error', new Error('Spawn failed'));
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Adapter] Analisi fallita:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});
