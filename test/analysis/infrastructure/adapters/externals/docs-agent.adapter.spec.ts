import { Test, TestingModule } from '@nestjs/testing';
import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { DocumentationAnalysisAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/docs-agent.adapter';
import { AgentRequest } from '../../../../../src/analysis/application/DTOs/models/requests/agent-request-model.model';
import { DocsAgentResponse } from '../../../../../src/analysis/application/DTOs/models/responses/docs-agent-response-model.model';
// Mock di child_process
jest.mock('node:child_process');

// Definiamo un'interfaccia per il mock del processo che estenda EventEmitter
// Questo risolve i problemi di "Unsafe member access" senza usare any
interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

describe('DocumentationAnalysisAdapter', () => {
  let adapter: DocumentationAnalysisAdapter;
  let consoleLogSpy: jest.SpyInstance;

  // FIX: mockRequest tipizzato correttamente senza cast pericolosi
  const mockRequest = {
    id: { value: 'test-repo' },
  } as AgentRequest;

  const validReport = {
    analysis_report: {
      metadata: {},
      API_standard_violations: [],
      docs_discrepancies: [],
      missing_files: [],
      dependency_audit: {
        readme_defined: [],
        config_defined: [],
        missing_in_config: [],
        undocumented_in_readme: [],
        version_mismatches: [],
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentationAnalysisAdapter],
    }).compile();

    adapter = module.get<DocumentationAnalysisAdapter>(DocumentationAnalysisAdapter);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper per creare un mock tipizzato del processo figlio
  const createMockProcess = (): MockChildProcess => {
    const proc = new EventEmitter() as MockChildProcess;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    return proc;
  };

  describe('runAnalysis & extractJson logic', () => {
    it('should extract JSON correctly even with leading/trailing noise', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const rawOutput = `Some random logs... \n ${JSON.stringify(validReport)} \n More logs...`;

      const promise = adapter.runAnalysis(mockRequest);

      // Usiamo nextTick per assicurarci che l'adapter stia ascoltando
      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(rawOutput));
        proc.emit('close', 0);
      });

      const result = await promise;
      expect(result).toBeInstanceOf(DocsAgentResponse);
      expect(result.analysis_report.metadata.status).toBe('success');
    });

    it('should handle agent error token correctly', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const errorJson = '{"status": "error", "message": "Python script failed"}';

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(errorJson));
        proc.emit('close', 0);
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
    });

    it('should return fallback if no JSON is found in output', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from('Just plain text without the brace character'));
        proc.emit('close', 0);
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Critical error during execution: No JSON found in the container output.',
        ),
      );
    });

    it('should handle malformed error token gracefully and fall back to best candidate', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      // JSON con error token malformato che causerà un'eccezione nel blocco try/catch
      const malformedErrorJson = '{"status": "error", invalid-json} { "valid": "json" }';

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(malformedErrorJson));
        proc.emit('close', 0);
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
    });

    it('should throw an error if JSON is unterminated', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const unterminatedJson = '{"analysis_report": { "metadata": {} } ';

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(unterminatedJson));
        proc.emit('close', 0);
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
    });

    it('should throw an error if parsed JSON is missing analysis_report', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from('{"random_key": "data"}'));
        proc.emit('close', 0);
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
    });
  });

  describe('Container Error Handling', () => {
    it('should return fallback when Docker exits with code 1', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stderr.emit('data', Buffer.from('Docker connection lost'));
        proc.emit('close', 1);
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Docker exit code 1'));
    });

    it('should return fallback when spawn throws an error event', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.emit('error', new Error('Spawn failed'));
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
    });

    it('should return fallback when string error is thrown', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        // Emette un errore stringa al posto dell'oggetto Error
        proc.emit('error', 'Spawn failed completely');
      });

      const result = await promise;
      expect(result.analysis_report.metadata.status).toBe('error');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Spawn failed completely'),
      );
    });
  });
});
