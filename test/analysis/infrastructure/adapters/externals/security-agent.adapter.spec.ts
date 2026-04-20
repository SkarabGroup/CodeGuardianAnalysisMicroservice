import { Test, TestingModule } from '@nestjs/testing';
import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';

import { LocalSecurityAnalysisAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/security-agent.adapter';
import { AgentRequest } from '../../../../../src/analysis/application/DTOs/models/requests/agent-request-model.model';
import { SecAgentResponse } from '../../../../../src/analysis/application/DTOs/models/responses/security-agent-response-model.model';

jest.mock('node:child_process');

jest.mock('node:fs', () => {
  const actualFs = jest.requireActual<typeof import('node:fs')>('node:fs');

  return {
    ...actualFs,
    existsSync: jest.fn(),
  };
});

interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

describe('LocalSecurityAnalysisAdapter', () => {
  let adapter: LocalSecurityAnalysisAdapter;

  const mockRequest = {
    id: { value: 'test-repo' },
  } as AgentRequest;

  const validReport = {
    analysis_report: {
      metadata: {
        repository: 'test-repo',
        status: 'SUCCESS',
      },
      trivy: [],
      semgrep: [],
      grype: [],
      errors: [],
    },
  };

  const createMockProcess = (): MockChildProcess => {
    const proc = new EventEmitter() as MockChildProcess;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    return proc;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalSecurityAnalysisAdapter],
    }).compile();

    adapter = module.get(LocalSecurityAnalysisAdapter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('runAnalysis success path', () => {
    it('should parse valid JSON output correctly', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(JSON.stringify(validReport)));
        proc.emit('close', 0);
      });

      const result = await promise;

      expect(result).toBeInstanceOf(SecAgentResponse);
      expect(result.analysis_report.metadata.status).toBe('success');
      expect(result.analysis_report.trivy).toEqual([]);
    });

    it('should include env-file when .env exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const proc = createMockProcess();
      const spawnMock = (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(JSON.stringify(validReport)));
        proc.emit('close', 0);
      });

      await promise;

      expect(spawnMock).toHaveBeenCalledWith('docker', expect.arrayContaining(['--env-file']));
    });

    it('should extract JSON even with noisy logs', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const noisyOutput = `
        Some logs...
        ${JSON.stringify(validReport)}
        More logs...
      `;

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(noisyOutput));
        proc.emit('close', 0);
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('success');
    });
  });

  describe('invalid output handling', () => {
    it('should fallback if no JSON is found', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from('just logs, no json here'));
        proc.emit('close', 0);
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('FAILED');
      expect(result.analysis_report.errors.length).toBe(1);
    });

    it('should fallback if JSON is invalid structure', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const invalidJson = JSON.stringify({ wrong_key: {} });

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(invalidJson));
        proc.emit('close', 0);
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('FAILED');
    });

    it('should fallback on malformed JSON', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const malformed = '{"analysis_report": { "trivy": [] ';

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(malformed));
        proc.emit('close', 0);
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('FAILED');
    });

    it('should warn when .env file is missing', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(JSON.stringify(validReport)));
        proc.emit('close', 0);
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('success');
    });

    it('should fallback when analysis_report is missing in parsed output', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const invalidOutput = JSON.stringify({
        some_other_field: {},
      });

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from(invalidOutput));
        proc.emit('close', 0);
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('FAILED');
      expect(result.analysis_report.errors.length).toBe(1);
    });
  });

  describe('container errors', () => {
    it('should fallback if container exits with error code', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.stderr.emit('data', Buffer.from('Some docker error'));
        proc.emit('close', 1);
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('FAILED');
    });

    it('should fallback if spawn emits error', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.emit('error', new Error('Spawn failed'));
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('FAILED');
    });

    it('should fallback on string error', async () => {
      const proc = createMockProcess();
      (childProcess.spawn as jest.Mock).mockReturnValue(proc);

      const promise = adapter.runAnalysis(mockRequest);

      process.nextTick(() => {
        proc.emit('error', 'unexpected failure');
      });

      const result = await promise;

      expect(result.analysis_report.metadata.status).toBe('FAILED');
    });
  });
});
