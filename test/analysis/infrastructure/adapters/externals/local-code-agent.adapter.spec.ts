import { Test, TestingModule } from '@nestjs/testing';
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

  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

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

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);

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

      mockExistsSync.mockReturnValue(true);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        const mockValidJson = JSON.stringify({
          analysis_report: {
            metadata: { status: 'success' },
            ai_interpretation: { verdict: 'Good' },
          },
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

      expect(consoleLogSpy).toHaveBeenCalledWith(
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
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Adapter] Critical error during execution:'),
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
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Docker exit code 1'));
    });

    it('should throw and handle error if JSON is found but malformed', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          processMock.stdout.emit('data', Buffer.from('{ "status": broken_value '));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(consoleLogSpy).toHaveBeenCalledWith(
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
      expect(consoleLogSpy).toHaveBeenCalledWith(
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
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unterminated JSON in container output'),
      );
    });

    it('should log a warning and not append --env-file if .env is missing', async () => {
      mockExistsSync.mockReturnValueOnce(false);
      const processMock = createMockProcess();
      const spawnSpy = jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        const mockValidJson = JSON.stringify({
          analysis_report: {
            metadata: { status: 'success' },
            ai_interpretation: { verdict: 'Good' },
          },
        });

        if (processMock.stdout) {
          processMock.stdout.emit('data', Buffer.from(mockValidJson));
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(spawnSpy).toHaveBeenCalledWith('docker', expect.not.arrayContaining(['--env-file']));
    });

    it('should catch JSON parse error in emergency extraction and fallback to normal search', async () => {
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
      expect(consoleDebugSpy).toHaveBeenCalledWith('Failed JSON Extraction', expect.anything());
    });

    it('should handle python tool error when message is an object', async () => {
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
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Adapter] Critical error during execution:'),
      );
    });

    it('should handle non-Error exceptions in catch block gracefully', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        processMock.emit('error', 'Critical unexpected system failure');
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Critical unexpected system failure'),
      );
    });

    it('should extract valid JSON successfully even with trailing garbage', async () => {
      const processMock = createMockProcess();
      jest.spyOn(childProcess, 'spawn').mockReturnValue(processMock);

      const analysisPromise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        if (processMock.stdout) {
          const validJson = JSON.stringify({
            analysis_report: {
              metadata: { status: 'success' },
              ai_interpretation: { verdict: 'Excellent' },
            },
          });
          processMock.stdout.emit(
            'data',
            Buffer.from(`${validJson}\nSOME TRAILING LOGS OR GARBAGE`),
          );
        }
        processMock.emit('close', 0);
      });

      const response = await analysisPromise;

      expect(response).toBeDefined();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Adapter] Analysis result successfully extracted.'),
      );
    });
  });
});
