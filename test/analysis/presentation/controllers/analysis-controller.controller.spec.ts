import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from '../../../../src/analysis/presentation/controllers/analysis-controller.controller';
import { START_ANALYSIS_SERVICE } from '../../../../src/analysis/application/services/start-analysis.as';
import { StartAnalysisUseCase } from '../../../../src/analysis/application/use-case/start-analysis.uc';
import { StartAnalysisResult } from '../../../../src/analysis/application/results/start-analysis-result.result';
import { StartAnalysisRequestDTO } from '../../../../src/analysis/presentation/DTOs/requests/request-analysis.dto';

describe('AnalysisController', () => {
  let controller: AnalysisController;
  let useCase: jest.Mocked<StartAnalysisUseCase>;

  beforeEach(async () => {
    // Creiamo un mock per lo Use Case
    const mockUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: START_ANALYSIS_SERVICE,
          useValue: mockUseCase,
        },
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
    useCase = module.get<jest.Mocked<StartAnalysisUseCase>>(START_ANALYSIS_SERVICE);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestAnalysis', () => {
    const mockDto: StartAnalysisRequestDTO = {
      repoUrl: 'https://github.com/user/repo',
    };

    it('should return success response when use case succeeds', async () => {
      // Arrange
      const analysisId = 'test-uuid-123';
      useCase.execute.mockResolvedValue(StartAnalysisResult.success(analysisId));

      // Act
      const response = await controller.requestAnalysis(mockDto);

      // Assert
      expect(response.analysisId).toBe(analysisId);
    });

    it('should return failure response when use case fails', async () => {
      // Arrange
      const errorMessage = 'Repository not found';
      useCase.execute.mockResolvedValue(StartAnalysisResult.failure(errorMessage));

      // Act
      const response = await controller.requestAnalysis(mockDto);

      // Assert
      expect(response.errorMessage).toBe(errorMessage);
    });

    it('should return failure response when an exception is thrown', async () => {
      // Arrange
      useCase.execute.mockRejectedValue(new Error('Unexpected Error'));

      // Act
      const response = await controller.requestAnalysis(mockDto);

      // Assert
      expect(response.errorMessage).toBe('Unexpected Error');
    });
  });
});
