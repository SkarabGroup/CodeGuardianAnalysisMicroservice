import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import * as fs from 'node:fs';
import { LocalCodeAnalysisAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/local-code-agent.adapter';
import { AgentRequest } from '../../../../../src/analysis/application/DTOs/models/requests/agent-request-model.model';
import { AnalysisId } from '../../../../../src/analysis/domain/value-objects/analysis-id.vo';

jest.mock('node:child_process');

jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  existsSync: jest.fn(),
}));

describe('LocalCodeAnalysisAdapter', () => {
  let adapter: LocalCodeAnalysisAdapter;

  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;

  // Tipizzazione forte del mock per rispettare le regole di TypeScript
  const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

  const mockAnalysisId = Object.create(AnalysisId.prototype) as AnalysisId;
  Object.defineProperty(mockAnalysisId, 'value', { value: 'test-id-123' });
  const mockRequest = new AgentRequest(mockAnalysisId);

  const createMockProcess = (): childProcess.ChildProcess => {
    const processMock = new EventEmitter() as childProcess.ChildProcess;
    processMock.stdout = new EventEmitter() as unknown as Readable;
    processMock.stderr = new EventEmitter() as unknown as Readable;
    return processMock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalCodeAnalysisAdapter],
    }).compile();

    adapter = module.get<LocalCodeAnalysisAdapter>(LocalCodeAnalysisAdapter);

    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      return;
    });

    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {
      return;
    });

    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {
      return;
    });

    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {
      return;
    });
    // Sostituito jest.spyOn con l'assegnazione diretta del valore di ritorno
    mockExistsSync.mockReturnValue(true);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('runAnalysis', () => {
    it('should successfully run docker container and parse JSON', async () => {
      const processMock = createMockProcess();
      const spawnSpy = jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        const mockValidJson = JSON.stringify({
          metadata: { status: 'success' },
          ai_interpretation: { verdict: 'Good' },
        });

        if (processMock.stdout) {
          processMock.stdout.emit('data', Buffer.from(mockValidJson));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();

      expect(spawnSpy).toHaveBeenCalledWith(
        'docker',
        expect.arrayContaining([
          'run',
          '--rm',
          '--env-file',
          expect.stringContaining('.env'),
          '-v',
          'analysis_tmp_data:/tmp',
          'strands-code-analyzer',
          `/tmp/${String(mockAnalysisId.value)}`,
        ]),
      );

      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Adapter] Analysis result successfully extracted.'),
      );
    });

    it('should handle python tool controlled error gracefully (fallback)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        const mockErrorJson = '{"status": "error", "message": "Max tokens limit reached"}';
        if (processMock.stdout) {
          processMock.stdout.emit('data', Buffer.from(`Dirty logs... ${mockErrorJson}`));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Agent returned an error: Max tokens limit reached'),
      );
    });

    it('should handle non-zero exit code (catch block)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stderr) {
          processMock.stderr.emit('data', Buffer.from('Docker crash error'));
        }
        processMock.emit('close', 1);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Docker exit code 1'));
    });

    it('should throw and handle error if JSON is found but malformed', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          // Questa stringa non chiude mai la parentesi correttamente per il parser iterativo
          processMock.stdout.emit('data', Buffer.from('{ "status": broken_value '));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unterminated JSON in container output'),
      );
    });

    it('should throw and handle error if no JSON is found in output', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          processMock.stdout.emit('data', Buffer.from('Plain text logs without any braces.'));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No JSON found in the container output.'),
      );
    });

    it('should throw and handle error for unterminated JSON', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          processMock.stdout.emit('data', Buffer.from('{"metadata": {"status": "running" '));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unterminated JSON in container output'),
      );
    });

    it('should log a warning and not append --env-file if .env is missing (line 31 coverage)', async () => {
      mockExistsSync.mockReturnValueOnce(false);
      const processMock = createMockProcess();
      const spawnSpy = jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        const mockValidJson = JSON.stringify({
          metadata: { status: 'success' },
          ai_interpretation: { verdict: 'Good' },
        });

        if (processMock.stdout) {
          processMock.stdout.emit('data', Buffer.from(mockValidJson));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Agent might not have requested credentials'),
      );
      // Verifica l'assenza del flag --env-file tramite expect.not per evitare cast insicuri
      expect(spawnSpy).toHaveBeenCalledWith('docker', expect.not.arrayContaining(['--env-file']));
    });

    it('should catch JSON parse error in emergency extraction and fallback to normal search (line 115 coverage)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          processMock.stdout.emit(
            'data',
            Buffer.from('{"status": "error", "details": {"broken": true}}'),
          );
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'Failed JSON Extraction',
        expect.anything(), // Accetta l'oggetto SyntaxError in modo flessibile
      );
    });
    it('should handle python tool error when message is an object (coverage lines 44-48)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          processMock.stdout.emit(
            'data',
            Buffer.from('{"status": "error", "message": {"code": 500, "detail": "Crash"}}'),
          );
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"code":500,"detail":"Crash"}'),
      );
    });

    it('should handle non-Error exceptions in catch block gracefully (coverage lines 53-54)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        processMock.emit('error', 'Critical unexpected system failure');
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Critical unexpected system failure'),
      );
    });

    it('should extract valid JSON successfully even with trailing garbage (coverage line 110+)', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          const validJson =
            '{"metadata": {"status": "success"}, "ai_interpretation": {"verdict": "Excellent"}}';
          processMock.stdout.emit(
            'data',
            Buffer.from(`${validJson}\nSOME TRAILING LOGS OR GARBAGE`),
          );
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Adapter] Analysis result successfully extracted.'),
      );
    });
  });
});
