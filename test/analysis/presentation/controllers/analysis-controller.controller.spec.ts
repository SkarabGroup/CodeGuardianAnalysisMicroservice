import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from '../../../../src/analysis/presentation/controllers/analysis-controller.controller';
import { START_ANALYSIS_SERVICE } from '../../../../src/analysis/application/services/start-analysis.as';
import { StartAnalysisRequestDTO } from '../../../../src/analysis/presentation/DTOs/requests/request-analysis.dto';
import { StartAnalysisResponseDTO } from '../../../../src/analysis/presentation/DTOs/responses/start-analysis-response.dto';
import { StartAnalysisResult } from '../../../../src/analysis/application/results/start-analysis-result.result';

import type { StartAnalysisUseCase } from '../../../../src/analysis/application/use-case/start-analysis.uc';

describe('AnalysisController', () => {
  let controller: AnalysisController;

  const mockStartAnalysis: jest.Mocked<StartAnalysisUseCase> = {
    execute: jest.fn(),
  };

  const VALID_DTO = new StartAnalysisRequestDTO(
    'https://github.com/owner/repo',
    'password123',
    'main',
    'a'.repeat(40),
    true,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: START_ANALYSIS_SERVICE,
          useValue: mockStartAnalysis,
        },
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
    jest.clearAllMocks();
  });

  describe('requestAnalysis', () => {
    it('should return success response when use case succeeds', async () => {
      const resultData = {
        user: 'user-uuid',
        id: 'analysis-uuid',
        url: VALID_DTO.repoUrl,
        branch: 'main',
        commit: 'a'.repeat(40),
        localPath: '/tmp/repo',
      };

      mockStartAnalysis.execute.mockResolvedValue(
        StartAnalysisResult.success(
          resultData.user,
          resultData.id,
          resultData.url,
          resultData.branch,
          resultData.commit,
          resultData.localPath,
        ),
      );

      const response = await controller.requestAnalysis(VALID_DTO);

      expect(response).toBeInstanceOf(StartAnalysisResponseDTO);
      expect(response.id).toBe(resultData.user);
      expect(response.user).toBe(resultData.id);
      expect(response.errorMessage).toBe('Analysis Started Successfully');
    });

    it('should return failure response when result.success is false', async () => {
      mockStartAnalysis.execute.mockResolvedValue(
        StartAnalysisResult.failure('', 'Repository not found'),
      );

      const response = await controller.requestAnalysis(VALID_DTO);

      expect(response).toBeInstanceOf(StartAnalysisResponseDTO);
      expect(response.id).toBeUndefined();
      expect(response.errorMessage).toBe('Repository not found');
    });

    it('should return default error message when failure message is empty', async () => {
      mockStartAnalysis.execute.mockResolvedValue(StartAnalysisResult.failure('', ''));

      const response = await controller.requestAnalysis(VALID_DTO);

      expect(response.errorMessage).toBe('Impossible to analyze this repository');
    });

    it('should catch exceptions and return failure response', async () => {
      mockStartAnalysis.execute.mockRejectedValue(new Error('System failure'));

      const response = await controller.requestAnalysis(VALID_DTO);

      expect(response.errorMessage).toBe('System failure');
      expect(response.id).toBeUndefined();
    });

    it('should return Internal Server Error when thrown value is not an Error object', async () => {
      mockStartAnalysis.execute.mockRejectedValue('Unknown string error');

      const response = await controller.requestAnalysis(VALID_DTO);

      expect(response.errorMessage).toBe('Internal Server Error');
    });

    it('should map DTO properties to command correctly', async () => {
      mockStartAnalysis.execute.mockResolvedValue(
        StartAnalysisResult.success('u', 'i', 'url', 'b', 'c', 'p'),
      );

      await controller.requestAnalysis(VALID_DTO);

      const command = mockStartAnalysis.execute.mock.calls[0][0];
      expect(command.url).toBe(VALID_DTO.repoUrl);
      expect(command.password).toBe(VALID_DTO.password);
      expect(command.branch).toBe(VALID_DTO.branch);
      expect(command.commit).toBe(VALID_DTO.commit);
      expect(command.user).toBeDefined();
    });

    it('should handle undefined optional fields in request', async () => {
      const minimalDto = new StartAnalysisRequestDTO(
        'https://github.com/minimal/repo',
        undefined,
        undefined,
        undefined,
        false,
      );

      mockStartAnalysis.execute.mockResolvedValue(
        StartAnalysisResult.success('u', 'i', 'url', 'b', 'c', 'p'),
      );

      await controller.requestAnalysis(minimalDto);

      const command = mockStartAnalysis.execute.mock.calls[0][0];
      expect(command.password).toBeUndefined();
      expect(command.branch).toBeUndefined();
      expect(command.commit).toBeUndefined();
    });
  });
});
