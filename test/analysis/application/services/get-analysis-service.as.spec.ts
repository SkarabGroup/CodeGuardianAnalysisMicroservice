import { Test, TestingModule } from '@nestjs/testing';
import { GetAnalysisService } from '../../../../src/analysis/application/services/get-analysis-service.as';
import {
  GET_DETAILED_ANALYSIS_PORT,
  GET_ALL_ANALYSES_FOR_USER_PORT,
} from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GetAnalysisFromIdCommand } from '../../../../src/analysis/application/commands/get-analysis-from-id.command';
import { GetAnalysisResult } from '../../../../src/analysis/application/results/get-analysis-result.result';
import { GetAllAnalysesForUserCommand } from '../../../../src/analysis/application/commands/get-all-analyses-for-user-command.command';
import { GetAllAnalysesForUserResult } from '../../../../src/analysis/application/results/get-all-analyses-for-user-result.result';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { UserId } from '../../../../src/analysis/domain/value-objects/user-id.vo';
import { v7 as uuidv7 } from 'uuid';
describe('GetAnalysisService', () => {
  let service: GetAnalysisService;

  // Mock della porta di persistenza
  const mockGetAnalysisFromIdPort = {
    getAnalysisFromId: jest.fn(),
  };

  const mockGetAllAnalysesForUserPort = {
    getAllAnalysesForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAnalysisService,
        {
          provide: GET_DETAILED_ANALYSIS_PORT,
          useValue: mockGetAnalysisFromIdPort,
        },
        {
          provide: GET_ALL_ANALYSES_FOR_USER_PORT,
          useValue: mockGetAllAnalysesForUserPort,
        },
      ],
    }).compile();

    service = module.get<GetAnalysisService>(GetAnalysisService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    const VALID_UUID = uuidv7(); // Genera un UUID valido per i test
    const command = new GetAnalysisFromIdCommand(VALID_UUID);

    it('should return success when analysis is found', async () => {
      // Mock dei dati restituiti dalla porta (Detailed Result)
      const mockDetailedData = {
        generalData: {
          analysisId: VALID_UUID,
          userId: 'user-1',
          repoURL: 'http://github.com/test',
          branch: 'main',
          commit: 'sha-123',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        docsReport: null,
      };

      mockGetAnalysisFromIdPort.getAnalysisFromId.mockResolvedValue(mockDetailedData);

      // Spia il metodo statico success per verificare la mappatura
      const successSpy = jest.spyOn(GetAnalysisResult, 'success');

      const result = await service.execute(command);

      expect(result.success).toBe(true);
      expect(mockGetAnalysisFromIdPort.getAnalysisFromId).toHaveBeenCalledWith(
        expect.any(AnalysisId),
      );
      expect(successSpy).toHaveBeenCalledWith(mockDetailedData);
    });

    it('should return failure when analysis is not found', async () => {
      mockGetAnalysisFromIdPort.getAnalysisFromId.mockResolvedValue(null);

      const result = await service.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain(`Analisi con ID ${VALID_UUID} non trovata`);
    });

    it('should return failure if AnalysisId.create throws (invalid UUID)', async () => {
      const invalidCommand = new GetAnalysisFromIdCommand('invalid-id');

      const result = await service.execute(invalidCommand);

      expect(result.success).toBe(false);
      // Il messaggio dipenderà dalla logica interna di AnalysisId.create
      expect(result.message).toBeDefined();
    });

    it('should catch exceptions from the port and return failure result', async () => {
      const dbError = new Error('Database connection lost');
      mockGetAnalysisFromIdPort.getAnalysisFromId.mockRejectedValue(dbError);

      const result = await service.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database connection lost');
    });

    it('should return default message if caught error is not an Error object', async () => {
      mockGetAnalysisFromIdPort.getAnalysisFromId.mockRejectedValue('Strange string error');

      const result = await service.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Errore interno del server');
    });
  });

  describe('getAllAnalysesForUser', () => {
    const VALID_USER_UUID = uuidv7();
    const command = new GetAllAnalysesForUserCommand(VALID_USER_UUID);

    it('should return success with mapped analyses', async () => {
      const mockAnalysesData = {
        dto: [{ analysisId: 'a1', repoURL: 'repo1' }],
      };
      mockGetAllAnalysesForUserPort.getAllAnalysesForUser.mockResolvedValue(mockAnalysesData);

      const successSpy = jest.spyOn(GetAllAnalysesForUserResult, 'success');

      const result = await service.getAllAnalysesForUser(command);

      expect(result.success).toBe(true);
      expect(result.analyses).toEqual(mockAnalysesData.dto);
      expect(mockGetAllAnalysesForUserPort.getAllAnalysesForUser).toHaveBeenCalledWith(
        expect.any(UserId),
      );
      expect(successSpy).toHaveBeenCalledWith(mockAnalysesData.dto);
    });

    it('should return success with empty array if dto is undefined', async () => {
      const mockAnalysesData = {}; // no dto populated
      mockGetAllAnalysesForUserPort.getAllAnalysesForUser.mockResolvedValue(mockAnalysesData);

      const result = await service.getAllAnalysesForUser(command);

      expect(result.success).toBe(true);
      expect(result.analyses).toEqual([]);
    });

    it('should return failure if UserId.create throws (invalid UUID)', async () => {
      const invalidCommand = new GetAllAnalysesForUserCommand('invalid-user-id');

      const result = await service.getAllAnalysesForUser(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('Invalid UUID');
    });

    it('should catch exceptions from the port and return failure result', async () => {
      const dbError = new Error('Database timeout');
      mockGetAllAnalysesForUserPort.getAllAnalysesForUser.mockRejectedValue(dbError);

      const result = await service.getAllAnalysesForUser(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database timeout');
    });

    it('should return default message if caught error is not an Error object', async () => {
      mockGetAllAnalysesForUserPort.getAllAnalysesForUser.mockRejectedValue('String error');

      const result = await service.getAllAnalysesForUser(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Errore interno del server');
    });
  });
});
