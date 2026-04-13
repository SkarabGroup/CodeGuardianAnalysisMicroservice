import { Test, TestingModule } from '@nestjs/testing';
import { DocumentationAnalysisAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/docs-agent.adapter';
import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { AgentRequest } from '../../../../../src/analysis/application/DTOs/models/requests/agent-request-model.model';
import { AgentResponse } from '../../../../../src/analysis/application/DTOs/models/responses/agent-response-model.model';

// Mock del modulo child_process
jest.mock('node:child_process');

describe('DocumentationAnalysisAdapter', () => {
  let adapter: DocumentationAnalysisAdapter;
  let spawnSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentationAnalysisAdapter],
    }).compile();

    adapter = module.get<DocumentationAnalysisAdapter>(DocumentationAnalysisAdapter);
    spawnSpy = jest.spyOn(childProcess, 'spawn');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('runAnalysis', () => {
    const mockRequest: AgentRequest = {
      id: { value: 'test-repo-id' },
    };

    it('should resolve successfully when docker exit code is 0', async () => {
      // Creiamo un finto processo che emette l'evento 'close' con codice 0
      const mockProcess = new EventEmitter();
      spawnSpy.mockReturnValue(mockProcess);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      // Simuliamo la chiusura del processo in modo asincrono
      process.nextTick(() => {
        mockProcess.emit('close', 0);
      });

      const result = await analysisPromise;

      expect(result).toBeInstanceOf(AgentResponse);
      expect(spawnSpy).toHaveBeenCalledWith(
        'docker',
        expect.arrayContaining([
          'run',
          '--rm',
          expect.stringContaining('analysis_tmp_data:/tmp'),
          expect.stringContaining('python3 /app/test.py "/tmp/test-repo-id"'),
        ]),
        { stdio: 'inherit' },
      );
    });

    it('should handle process errors (spawn error)', async () => {
      const mockProcess = new EventEmitter();
      spawnSpy.mockReturnValue(mockProcess);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        mockProcess.emit('error', new Error('Spawn failed'));
      });

      const result = await analysisPromise;

      // L'adapter corrente cattura l'errore e ritorna comunque un AgentResponse
      expect(result).toBeInstanceOf(AgentResponse);
    });

    it('should handle non-zero exit codes', async () => {
      const mockProcess = new EventEmitter();
      spawnSpy.mockReturnValue(mockProcess);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        mockProcess.emit('close', 1); // Errore nel container
      });

      const result = await analysisPromise;

      expect(result).toBeInstanceOf(AgentResponse);
    });
  });
});
