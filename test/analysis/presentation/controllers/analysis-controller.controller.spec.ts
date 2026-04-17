import { Test, TestingModule } from '@nestjs/testing';
import {
  AnalysisController,
  JwtAuthGuard,
  JwtStrategy,
  userIdFactory,
} from '../../../../src/analysis/presentation/controllers/analysis-controller.controller';
import { ExecutionContext } from '@nestjs/common';

// Services/UseCases
import { START_ANALYSIS_SERVICE } from '../../../../src/analysis/application/services/start-analysis.as';
import {
  GET_ANALYSIS_SERVICE,
  GET_ALL_ANALYSES_FOR_USER_SERVICE,
} from '../../../../src/analysis/application/services/get-analysis-service.as';
import type { StartAnalysisUseCase } from '../../../../src/analysis/application/use-case/start-analysis.uc';
import type { GetAnalysisUseCase } from '../../../../src/analysis/application/use-case/get-analysis-use-case.uc';
import type { GetAllAnalysesForUserUseCase } from '../../../../src/analysis/application/use-case/get-all-analyses-for-user.uc';

// DTOs & Results
import { StartAnalysisRequestDTO } from '../../../../src/analysis/presentation/DTOs/requests/request-analysis.dto';
import { StartAnalysisResponseDTO } from '../../../../src/analysis/presentation/DTOs/responses/start-analysis-response.dto';
import { StartAnalysisResult } from '../../../../src/analysis/application/results/start-analysis-result.result';
import { GetAnalysisByIdRequestDTO } from '../../../../src/analysis/presentation/DTOs/requests/get-analysis-by-id.dto';
import { GetAnalysisResponseDTO } from '../../../../src/analysis/presentation/DTOs/responses/get-analysis-by-id.dto';
import { GetAllAnalysesForUserResponseDTO } from '../../../../src/analysis/presentation/DTOs/responses/get-all-analyses-for-user-response.dto';
import { GetAllAnalysesForUserResult } from '../../../../src/analysis/application/results/get-all-analyses-for-user-result.result';

// Infrastructure
import { ConfigurationService } from '../../../../src/analysis/infrastructure/configuration/configuration.service';

describe('JwtStrategy', () => {
  it('should validate payload and return user object', async () => {
    const mockConfig = { jwtSecret: 'test-secret' } as ConfigurationService;
    const strategy = new JwtStrategy(mockConfig);
    const payload = { sub: 'user-id', email: 'test@mail.com' };

    const result = await strategy.validate(payload);

    expect(result).toEqual({ userId: payload.sub, email: payload.email });
  });
});

describe('UserId Decorator', () => {
  it('should extract userId from the request object', () => {
    const mockRequest = { user: { userId: 'token-uuid', email: 'test@host.com' } };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = userIdFactory(null, mockContext);
    expect(result).toBe('token-uuid');
  });
});

describe('AnalysisController', () => {
  let controller: AnalysisController;

  // Mock degli Use Cases
  const mockStartAnalysis: jest.Mocked<StartAnalysisUseCase> = {
    execute: jest.fn(),
  };

  const mockGetAnalysis: jest.Mocked<GetAnalysisUseCase> = {
    execute: jest.fn(),
  };

  const mockGetAllAnalyses: jest.Mocked<GetAllAnalysesForUserUseCase> = {
    getAllAnalysesForUser: jest.fn(),
  };

  const MOCK_USER_ID = 'user-uuid-from-jwt';
  const VALID_START_DTO = new StartAnalysisRequestDTO(
    'https://github.com/owner/repo',
    'password123',
    'main',
    'a'.repeat(40),
    true,
    true,
    true,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        { provide: START_ANALYSIS_SERVICE, useValue: mockStartAnalysis },
        { provide: GET_ANALYSIS_SERVICE, useValue: mockGetAnalysis },
        { provide: GET_ALL_ANALYSES_FOR_USER_SERVICE, useValue: mockGetAllAnalyses },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalysisController>(AnalysisController);
    jest.clearAllMocks();
  });

  describe('requestAnalysis (POST)', () => {
    it('should return success response when use case succeeds', async () => {
      const resultData = {
        user: MOCK_USER_ID,
        id: 'analysis-uuid',
        url: VALID_START_DTO.repoUrl,
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

      const response = await controller.requestAnalysis(VALID_START_DTO, MOCK_USER_ID);

      expect(response).toBeInstanceOf(StartAnalysisResponseDTO);
      expect(response.user).toBe(resultData.user);
      expect(response.id).toBe(resultData.id);
      expect(response.errorMessage).toBe('Analysis Started Successfully');
    });

    it('should catch exceptions and return failure response', async () => {
      mockStartAnalysis.execute.mockRejectedValue(new Error('System failure'));
      const response = await controller.requestAnalysis(VALID_START_DTO, MOCK_USER_ID);
      expect(response.errorMessage).toBe('System failure');
    });

    it('should map DTO properties and JWT userId to command correctly', async () => {
      mockStartAnalysis.execute.mockResolvedValue(
        StartAnalysisResult.success('u', 'i', 'url', 'b', 'c', 'p'),
      );

      await controller.requestAnalysis(VALID_START_DTO, MOCK_USER_ID);

      const command = mockStartAnalysis.execute.mock.calls[0][0];
      expect(command.url).toBe(VALID_START_DTO.repoUrl);
      expect(command.user).toBe(MOCK_USER_ID);
    });
  });

  describe('getAnalysisById (GET)', () => {
    const ANALYSIS_ID = 'test-analysis-id';
    const GET_DTO = new GetAnalysisByIdRequestDTO(ANALYSIS_ID);

    it('should return analysis data when use case succeeds', async () => {
      const mockResult = {
        success: true,
        id: ANALYSIS_ID,
        url: 'https://github.com/repo',
        status: 'completed',
      };
      mockGetAnalysis.execute.mockResolvedValue(mockResult);

      const response = await controller.getAnalysisById(GET_DTO);

      expect(response).toBeInstanceOf(GetAnalysisResponseDTO);
    });

    it('should handle failure results from use case via DTO mapping', async () => {
      const mockFailureResult = {
        success: false,
        message: 'Analysis not found',
      };

      mockGetAnalysis.execute.mockResolvedValue(mockFailureResult);

      // Qui testiamo che GetAnalysisResponseDTO.fromResult venga chiamato (implicitamente)
      const response = await controller.getAnalysisById(GET_DTO);
      expect(response.success).toBe(false);
    });

    it('should catch exceptions and return error message', async () => {
      mockGetAnalysis.execute.mockRejectedValue(new Error('Database error'));

      const response = await controller.getAnalysisById(GET_DTO);

      expect(response.success).toBe(false);
      // Verifichiamo il mapping del blocco catch nel controller
      expect(response.message).toBe('Database error');
    });

    it('should return Internal Server Error when thrown value is not an Error object', async () => {
      mockGetAnalysis.execute.mockRejectedValue('Unknown error');

      const response = await controller.getAnalysisById(GET_DTO);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Internal Server Error');
    });

    it('should correctly map the DTO ID to GetAnalysisFromIdCommand', async () => {
      mockGetAnalysis.execute.mockResolvedValue({ success: true });

      await controller.getAnalysisById(GET_DTO);

      const command = mockGetAnalysis.execute.mock.calls[0][0];
      // Verifica che il comando creato internamente al controller abbia l'ID corretto
      expect(command.analysisId).toBe(ANALYSIS_ID);
    });
  });

  describe('getAllAnalysesForUser (GET)', () => {
    it('should return analyses data when use case succeeds', async () => {
      const mockAnalysesDTOs = [{ analysisId: '1', repoURL: 'repo-1' }];
      const mockResult = GetAllAnalysesForUserResult.success(mockAnalysesDTOs);

      mockGetAllAnalyses.getAllAnalysesForUser.mockResolvedValue(mockResult);

      const response = await controller.getAllAnalysesForUser(MOCK_USER_ID);

      expect(response).toBeInstanceOf(GetAllAnalysesForUserResponseDTO);
      expect(response.success).toBe(true);
      expect(response.analyses).toEqual(mockAnalysesDTOs);
    });

    it('should return failure response when use case fails', async () => {
      const mockResult = GetAllAnalysesForUserResult.failure('Failure from usecase');

      mockGetAllAnalyses.getAllAnalysesForUser.mockResolvedValue(mockResult);

      const response = await controller.getAllAnalysesForUser(MOCK_USER_ID);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Failure from usecase');
    });

    it('should catch exceptions and return error message', async () => {
      mockGetAllAnalyses.getAllAnalysesForUser.mockRejectedValue(new Error('Network error'));

      const response = await controller.getAllAnalysesForUser(MOCK_USER_ID);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Network error');
    });

    it('should return Internal Server Error when thrown value is not an Error object', async () => {
      mockGetAllAnalyses.getAllAnalysesForUser.mockRejectedValue('Unknown API error');

      const response = await controller.getAllAnalysesForUser(MOCK_USER_ID);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Internal Server Error');
    });
  });

  describe('requestAnalysis POST additional tests', () => {
    it('should map optional properties to undefined if empty', async () => {
      const EMPTY_DTO = new StartAnalysisRequestDTO(
        'https://github.com/owner/repo',
        '',
        '',
        '',
        true,
        true,
        true,
      );
      mockStartAnalysis.execute.mockResolvedValue(
        StartAnalysisResult.success('u', 'i', 'url', 'b', 'c', 'p'),
      );
      await controller.requestAnalysis(EMPTY_DTO, MOCK_USER_ID);

      const command =
        mockStartAnalysis.execute.mock.calls[mockStartAnalysis.execute.mock.calls.length - 1][0];
      expect(command.password).toBeUndefined();
      expect(command.branch).toBeUndefined();
      expect(command.commit).toBeUndefined();
    });

    it('should return failure response if use case returns success:false', async () => {
      const mockFailureResult = StartAnalysisResult.failure(MOCK_USER_ID, 'Custom invalid config');
      mockStartAnalysis.execute.mockResolvedValue(mockFailureResult);

      const response = await controller.requestAnalysis(VALID_START_DTO, MOCK_USER_ID);

      expect(response.user).toBeUndefined();
      expect(response.errorMessage).toBe('Custom invalid config');
    });

    it('should fallback to default error message if use case returns success:false but no message', async () => {
      const mockFailureResult = StartAnalysisResult.failure(MOCK_USER_ID, '');
      mockStartAnalysis.execute.mockResolvedValue(mockFailureResult);

      const response = await controller.requestAnalysis(VALID_START_DTO, MOCK_USER_ID);

      expect(response.user).toBeUndefined();
      expect(response.errorMessage).toBe('Impossible to analyze this repository');
    });

    it('should handle non-Error exceptions gracefully in catch block', async () => {
      mockStartAnalysis.execute.mockRejectedValue('Random unhandled string runtime exception');

      const response = await controller.requestAnalysis(VALID_START_DTO, MOCK_USER_ID);

      expect(response.user).toBeUndefined();
      expect(response.errorMessage).toBe('Internal Server Error');
    });
  });
});
