import { Test, TestingModule } from '@nestjs/testing';
import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import * as fs from 'node:fs';
import { DocumentationAnalysisAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/docs-agent.adapter';
import { AgentRequest } from '../../../../../src/analysis/application/DTOs/models/requests/agent-request-model.model';
import { DocsAgentResponse } from '../../../../../src/analysis/application/DTOs/models/responses/docs-agent-response-model.model';
import { AnalysisId } from '../../../../../src/analysis/domain/value-objects/analysis-id.vo';

jest.mock('node:child_process');

jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  existsSync: jest.fn(),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

const mockAnalysisId = Object.create(AnalysisId.prototype) as AnalysisId;
Object.defineProperty(mockAnalysisId, 'value', { value: 'test-repo-id' });
const mockRequest = new AgentRequest(mockAnalysisId);

const createMockProcess = (): childProcess.ChildProcess => {
  const proc = new EventEmitter() as childProcess.ChildProcess;
  proc.stdout = new EventEmitter() as unknown as Readable;
  proc.stderr = new EventEmitter() as unknown as Readable;
  return proc;
};

const validDocsJson = JSON.stringify({
  analysis_report: {
    metadata: { repository: '/tmp/test-repo-id', status: 'success' },
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
});

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('DocumentationAnalysisAdapter', () => {
  let adapter: DocumentationAnalysisAdapter;

  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentationAnalysisAdapter],
    }).compile();

    adapter = module.get<DocumentationAnalysisAdapter>(DocumentationAnalysisAdapter);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);

    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Sanity ────────────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  // ── runAnalysis ───────────────────────────────────────────────────────────

  describe('runAnalysis', () => {
    describe('happy path', () => {
      it('should return a DocsAgentResponse on valid JSON output', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);

        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(validDocsJson));
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report).toBeDefined();
        expect(result.analysis_report.API_standard_violations).toEqual([]);
      });

      it('should log success message after extraction', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(validDocsJson));
          proc.emit('close', 0);
        });

        await promise;

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Analysis result successfully extracted'),
        );
      });

      it('should pass correct docker arguments when .env file exists', async () => {
        const proc = createMockProcess();
        const spawnSpy = jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        mockExistsSync.mockReturnValue(true);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(validDocsJson));
          proc.emit('close', 0);
        });

        await promise;

        expect(spawnSpy).toHaveBeenCalledWith(
          'docker',
          expect.arrayContaining([
            'run',
            '--rm',
            '-v',
            expect.stringContaining('analysis_tmp_data:/tmp'),
            '--entrypoint',
            'sh',
            'strands-documentation-analyzer',
            '-c',
            expect.stringContaining(`python3 /app/test.py "/tmp/test-repo-id"`),
            '--env-file',
            expect.stringContaining('.env'),
          ]),
        );
      });

      it('should correctly stream chunks of stdout and reassemble them', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);

        const half = Math.floor(validDocsJson.length / 2);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(validDocsJson.slice(0, half)));
          proc.stdout!.emit('data', Buffer.from(validDocsJson.slice(half)));
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
      });
    });

    // ── .env file absent ────────────────────────────────────────────────────

    describe('when .env file is missing', () => {
      it('should log a warning and NOT append --env-file to docker args', async () => {
        mockExistsSync.mockReturnValue(false);

        const proc = createMockProcess();
        const spawnSpy = jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(validDocsJson));
          proc.emit('close', 0);
        });

        await promise;

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Agent might not have requested credentials'),
        );
        expect(spawnSpy).toHaveBeenCalledWith('docker', expect.not.arrayContaining(['--env-file']));
      });
    });

    // ── error token path ────────────────────────────────────────────────────

    describe('error token extraction', () => {
      it('should return fallback response when agent emits {"status": "error"} token', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit(
            'data',
            Buffer.from('Some logs...\n{"status": "error", "message": "Agent crashed"}'),
          );
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        // The error JSON lacks analysis_report, so it triggers the fallback
        expect(result.analysis_report.metadata.status).toBe('error');
      });

      it('should fall through to iterative scan when error token JSON is malformed', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        // Embed a broken error token followed by valid docs JSON
        const raw = `logs {"status": "error" BROKEN} ${validDocsJson}`;

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(raw));
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        // Falls through to iterative scan which finds analysis_report
        expect(result.analysis_report).toBeDefined();
      });

      it('should trigger console.debug on failed error-token JSON parse', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        // error token present, but the brace is closed on a nested object making extraction grab the wrong slice
        const raw = `{"status": "error", "details": {"broken": true}} ${validDocsJson}`;

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(raw));
          proc.emit('close', 0);
        });

        await promise;

        expect(consoleDebugSpy).toHaveBeenCalledWith('Failed JSON Extraction', expect.anything());
      });
    });

    // ── missing analysis_report ──────────────────────────────────────────────

    describe('when analysis_report key is absent', () => {
      it('should return fallback when JSON has no analysis_report field', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const jsonWithoutReport = JSON.stringify({ some_other_key: { data: 1 } });

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(jsonWithoutReport));
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report.metadata.status).toBe('error');
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Expected analysis_report field not found'),
        );
      });
    });

    // ── extractJson edge cases ───────────────────────────────────────────────

    describe('extractJson edge cases', () => {
      it('should return fallback when stdout contains no JSON at all', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from('Plain text without any braces'));
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report.metadata.status).toBe('error');
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('No JSON found in the container output'),
        );
      });

      it('should return fallback for unterminated JSON (unclosed brace)', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from('{"analysis_report": {"metadata": {'));
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report.metadata.status).toBe('error');
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unterminated JSON in container output'),
        );
      });

      it('should return bestCandidate when JSON is valid but has no analysis_report and throws', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        // Two valid JSON objects: first lacks analysis_report, second too — bestCandidate is used
        const raw = `{"foo": 1} {"bar": 2}`;

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(raw));
          proc.emit('close', 0);
        });

        // No analysis_report found → throws → fallback response
        const result = await promise;
        expect(result).toBeInstanceOf(DocsAgentResponse);
      });

      it('should scan past malformed JSON chunks and find valid analysis_report', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        // Dirty output before a valid JSON blob
        const raw = `noise {broken json} more noise ${validDocsJson}`;

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stdout!.emit('data', Buffer.from(raw));
          proc.emit('close', 0);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report.metadata.status).toBe('success');
      });
    });

    // ── runContainer failure paths ───────────────────────────────────────────

    describe('container failures', () => {
      it('should return fallback response on non-zero exit code', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stderr!.emit('data', Buffer.from('Docker internal error'));
          proc.emit('close', 1);
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report.metadata.status).toBe('error');
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Critical error during execution'),
        );
      });

      it('should include stderr in the error message on non-zero exit', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.stderr!.emit('data', Buffer.from('OOM killed'));
          proc.emit('close', 137);
        });

        await promise;

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('OOM killed'));
      });

      it('should return fallback response when spawn emits an error event', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => {
          proc.emit('error', new Error('ENOENT: docker not found'));
        });

        const result = await promise;

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report.metadata.status).toBe('error');
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('docker not found'));
      });

      it('should return fallback response when spawn itself throws synchronously', async () => {
        jest.spyOn(childProcess, 'spawn').mockImplementation(() => {
          throw new Error('Spawn threw synchronously');
        });

        const result = await adapter.runAnalysis(mockRequest);

        expect(result).toBeInstanceOf(DocsAgentResponse);
        expect(result.analysis_report.metadata.status).toBe('error');
      });
    });

    // ── fallback response shape ──────────────────────────────────────────────

    describe('fallback response structure', () => {
      it('should embed the repository id in the fallback metadata', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => proc.emit('close', 1));

        const result = await promise;

        expect(result.analysis_report.metadata.repository).toBe('test-repo-id');
      });

      it('should return empty arrays for all fallback collections', async () => {
        const proc = createMockProcess();
        jest.spyOn(childProcess, 'spawn').mockReturnValue(proc);

        const promise = adapter.runAnalysis(mockRequest);
        process.nextTick(() => proc.emit('close', 1));

        const result = await promise;
        const report = result.analysis_report;

        expect(report.API_standard_violations).toEqual([]);
        expect(report.docs_discrepancies).toEqual([]);
        expect(report.missing_files).toEqual([]);
        expect(report.dependency_audit.readme_defined).toEqual([]);
        expect(report.dependency_audit.config_defined).toEqual([]);
        expect(report.dependency_audit.missing_in_config).toEqual([]);
        expect(report.dependency_audit.undocumented_in_readme).toEqual([]);
        expect(report.dependency_audit.version_mismatches).toEqual([]);
      });
    });
  });
});
