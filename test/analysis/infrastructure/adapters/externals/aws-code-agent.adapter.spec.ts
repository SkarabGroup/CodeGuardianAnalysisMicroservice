import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'node:fs/promises';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { AWSCodeAnalysisAdapter } from '../../../../../src/analysis/infrastructure/adapters/externals/aws-code-agent.adapter';
import { ConfigurationService } from '../../../../../src/analysis/infrastructure/configuration/configuration.service';
import { AgentRequest } from '../../../../../src/analysis/application/DTOs/models/requests/agent-request-model.model';
import { CodeAgentResponsePayload } from '../../../../../src/analysis/application/DTOs/models/responses/code-agent-response-model.model';

jest.mock('@aws-sdk/client-ecs');
jest.mock('node:fs/promises');

describe('AWSCodeAnalysisAdapter', () => {
  let adapter: AWSCodeAnalysisAdapter;
  let mockSend: jest.Mock<Promise<unknown>, [unknown]>;

  const mockFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
  const mockFsRm = fs.rm as jest.MockedFunction<typeof fs.rm>;

  const mockConfigService = {
    awsRegion: 'eu-central-1',
  } as unknown as ConfigurationService;

  const mockRequest = {
    id: { value: '123e4567-e89b-12d3-a456-426614174000' },
  } as unknown as AgentRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockSend = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({});

    const mockECSClient = ECSClient as unknown as jest.Mock;
    mockECSClient.mockImplementation(() => ({
      send: mockSend,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AWSCodeAnalysisAdapter,
        {
          provide: ConfigurationService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    adapter = module.get<AWSCodeAnalysisAdapter>(AWSCodeAnalysisAdapter);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('runAnalysis', () => {
    it('should execute ECS task and return parsed JSON on success', async () => {
      const validPayload: CodeAgentResponsePayload = {
        metadata: { repository: 'repo', status: 'success' },
        ai_interpretation: {
          verdict: 'Good',
          executive_summary: 'All checks passed',
          static_analysis_evaluation: { total_issues_analyzed: 0, key_issues_reasoning: [] },
          coverage_evaluation: { overall_health: 'Good', critical_files_reasoning: [] },
        },
      };

      mockFsReadFile.mockResolvedValue(JSON.stringify(validPayload));
      mockFsRm.mockResolvedValue(undefined);

      const result = await adapter.runAnalysis(mockRequest);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(RunTaskCommand).toHaveBeenCalledTimes(1);
      expect(mockFsReadFile).toHaveBeenCalled();
      expect(mockFsRm).toHaveBeenCalledWith(
        '/tmp/123e4567-e89b-12d3-a456-426614174000/output.json',
        { force: true },
      );
      expect(result.ai_interpretation.verdict).toBe('Good');
      expect(result.metadata.status).toBe('success');
    });

    it('should return fallback response if ECS send fails', async () => {
      mockSend.mockRejectedValue(new Error('AWS connection error'));

      const result = await adapter.runAnalysis(mockRequest);

      expect(result.ai_interpretation.verdict).toBe('Critical');
      expect(result.ai_interpretation.executive_summary).toContain('AWS connection error');
    });

    it('should handle timeout if output file is never created', async () => {
      jest.useFakeTimers();

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFsReadFile.mockRejectedValue(error);

      const promise = adapter.runAnalysis(mockRequest);

      await jest.advanceTimersByTimeAsync(905000);

      const result = await promise;

      expect(result.ai_interpretation.verdict).toBe('Critical');
      expect(result.ai_interpretation.executive_summary).toContain('Timeout');
    });

    it('should handle invalid JSON structure from tool output', async () => {
      mockFsReadFile.mockResolvedValue('Plain text error, not a JSON');

      const result = await adapter.runAnalysis(mockRequest);

      expect(result.ai_interpretation.verdict).toBe('Critical');
      expect(result.ai_interpretation.executive_summary).toContain('No JSON found');
    });

    it('should extract JSON correctly if wrapped in stdout logs', async () => {
      const validPayload: CodeAgentResponsePayload = {
        metadata: { repository: 'repo', status: 'success' },
        ai_interpretation: {
          verdict: 'Ok',
          executive_summary: 'Log wrapper test',
          static_analysis_evaluation: { total_issues_analyzed: 0, key_issues_reasoning: [] },
          coverage_evaluation: { overall_health: 'Good', critical_files_reasoning: [] },
        },
      };

      const rawOutput = `
        Loading packages...
        Done.
        ${JSON.stringify(validPayload)}
        Shutting down...
      `;

      mockFsReadFile.mockResolvedValue(rawOutput);
      mockFsRm.mockResolvedValue(undefined);

      const result = await adapter.runAnalysis(mockRequest);

      expect(result.ai_interpretation.verdict).toBe('Ok');
    });

    it('should throw and generate fallback if JSON status is error', async () => {
      const errorJson = JSON.stringify({
        status: 'error',
        message: 'Python tool crashed internally',
      });
      mockFsReadFile.mockResolvedValue(errorJson);

      const result = await adapter.runAnalysis(mockRequest);

      expect(result.ai_interpretation.verdict).toBe('Critical');
      expect(result.ai_interpretation.executive_summary).toContain(
        'Python tool crashed internally',
      );
    });
  });
});
