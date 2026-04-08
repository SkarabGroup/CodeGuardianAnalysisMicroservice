import { Test, TestingModule } from '@nestjs/testing';
import { PatController } from '../../../../src/analysis/presentation/controllers/pat-controller.controller';

import { ADD_NEW_PAT } from '../../../../src/analysis/application/services/new-pat-service.as';
import { DELETE_PAT } from '../../../../src/analysis/application/services/delete-pat-service.as';
import { UPDATE_PAT } from '../../../../src/analysis/application/services/update-pat-service.as';

import { NewPatCommand } from '../../../../src/analysis/application/commands/new-pat-command.command';
import { DeletePatCommand } from '../../../../src/analysis/application/commands/delete-pat-command.command';
import { UpdatePatCommand } from '../../../../src/analysis/application/commands/update-pat-command.command';

import { PostPatRequestDTO } from '../../../../src/analysis/presentation/DTOs/requests/post-pat-request.dto';
import { DeletePatRequestDTO } from '../../../../src/analysis/presentation/DTOs/requests/delete-pat-request.dto';
import { UpdatePatRequestDTO } from '../../../../src/analysis/presentation/DTOs/requests/update-pat-request.dto';

import { PostPatResponseDTO } from '../../../../src/analysis/presentation/DTOs/responses/post-pat-response.dto';
import { DeletePatResponseDTO } from '../../../../src/analysis/presentation/DTOs/responses/delete-pat-response.dto';
import { UpdatePatResponseDTO } from '../../../../src/analysis/presentation/DTOs/responses/update-pat-response.dto';

interface MockServiceResult {
  isSuccess: boolean;
  errorMessage?: string;
}

describe('PatController', () => {
  let controller: PatController;
  let newPatExecuteMock: jest.Mock<Promise<MockServiceResult>, [NewPatCommand]>;
  let deletePatExecuteMock: jest.Mock<Promise<MockServiceResult>, [DeletePatCommand]>;
  let updatePatExecuteMock: jest.Mock<Promise<MockServiceResult>, [UpdatePatCommand]>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    newPatExecuteMock = jest.fn<Promise<MockServiceResult>, [NewPatCommand]>();
    deletePatExecuteMock = jest.fn<Promise<MockServiceResult>, [DeletePatCommand]>();
    updatePatExecuteMock = jest.fn<Promise<MockServiceResult>, [UpdatePatCommand]>();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatController],
      providers: [
        {
          provide: ADD_NEW_PAT,
          useValue: { execute: newPatExecuteMock },
        },
        {
          provide: DELETE_PAT,
          useValue: { execute: deletePatExecuteMock },
        },
        {
          provide: UPDATE_PAT,
          useValue: { execute: updatePatExecuteMock },
        },
      ],
    }).compile();

    controller = module.get<PatController>(PatController);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('addNewPat', () => {
    const dto = new PostPatRequestDTO();
    dto.repositoryUrl = 'https://github.com/org/repo';
    dto.password = 'my-secret-password';
    dto.personalAccessToken = 'ghp_token123';

    it('should return success when use case succeeds', async () => {
      newPatExecuteMock.mockResolvedValue({ isSuccess: true });

      const result = await controller.addNewPat(dto);

      expect(result).toEqual(PostPatResponseDTO.success());

      const calledCommand = newPatExecuteMock.mock.calls[0][0];
      expect(calledCommand.repositoryUrl).toBe(dto.repositoryUrl);
      expect(calledCommand.patPassword).toBe(dto.password);
      expect(calledCommand.personalAccessToken).toBe(dto.personalAccessToken);
    });

    it('should return failure with port error message when use case fails', async () => {
      newPatExecuteMock.mockResolvedValue({
        isSuccess: false,
        errorMessage: 'Credentials already exist',
      });

      const result = await controller.addNewPat(dto);

      expect(result).toEqual(PostPatResponseDTO.failure('Credentials already exist'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Impossible to add pat');
    });

    it('should return failure with default message when errorMessage is missing', async () => {
      newPatExecuteMock.mockResolvedValue({ isSuccess: false });

      const result = await controller.addNewPat(dto);

      expect(result).toEqual(PostPatResponseDTO.failure('Impossible to Add a new pat'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Impossible to add pat');
    });

    it('should catch Error instances and return their message', async () => {
      newPatExecuteMock.mockRejectedValue(new Error('Database timeout'));

      const result = await controller.addNewPat(dto);

      expect(result).toEqual(PostPatResponseDTO.failure('Database timeout'));
    });

    it('should catch non-Error thrown values and return Internal Server Error', async () => {
      newPatExecuteMock.mockRejectedValue('unexpected string error');

      const result = await controller.addNewPat(dto);

      expect(result).toEqual(PostPatResponseDTO.failure('Internal Server Error'));
    });
  });

  describe('deletePat', () => {
    const dto = new DeletePatRequestDTO('https://github.com/org/repo', 'my-secret-password');

    it('should return success when use case succeeds', async () => {
      deletePatExecuteMock.mockResolvedValue({ isSuccess: true });

      const result = await controller.deletePat(dto);

      expect(result).toEqual(DeletePatResponseDTO.success());

      const calledCommand = deletePatExecuteMock.mock.calls[0][0];
      expect(calledCommand.repositoryUrl).toBe(dto.repositoryUrl);
      expect(calledCommand.patPassword).toBe(dto.password);
    });

    it('should return failure with port error message when use case fails', async () => {
      deletePatExecuteMock.mockResolvedValue({
        isSuccess: false,
        errorMessage: 'Credential not found',
      });

      const result = await controller.deletePat(dto);

      expect(result).toEqual(DeletePatResponseDTO.failure('Credential not found'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Impossible to delete pat');
    });

    it('should return failure with default message when errorMessage is missing', async () => {
      deletePatExecuteMock.mockResolvedValue({ isSuccess: false });

      const result = await controller.deletePat(dto);

      expect(result).toEqual(DeletePatResponseDTO.failure('Impossible to delete the pat'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Impossible to delete pat');
    });

    it('should catch Error instances and return their message', async () => {
      deletePatExecuteMock.mockRejectedValue(new Error('Connection failed'));

      const result = await controller.deletePat(dto);

      expect(result).toEqual(DeletePatResponseDTO.failure('Connection failed'));
    });

    it('should catch non-Error thrown values and return Internal Server Error', async () => {
      deletePatExecuteMock.mockRejectedValue(12345);

      const result = await controller.deletePat(dto);

      expect(result).toEqual(DeletePatResponseDTO.failure('Internal Server Error'));
    });
  });

  describe('updatePat', () => {
    const dto = new UpdatePatRequestDTO(
      'https://github.com/org/repo',
      'my-secret-password',
      'ghp_newtoken456',
    );

    it('should return success when use case succeeds', async () => {
      updatePatExecuteMock.mockResolvedValue({ isSuccess: true });

      const result = await controller.updatePat(dto);

      expect(result).toEqual(UpdatePatResponseDTO.success());

      const calledCommand = updatePatExecuteMock.mock.calls[0][0];
      expect(calledCommand.repositoryUrl).toBe(dto.repositoryUrl);
      expect(calledCommand.patPassword).toBe(dto.password);
      expect(calledCommand.newPat).toBe(dto.newPersonalAccessToken);
    });

    it('should return failure with port error message when use case fails', async () => {
      updatePatExecuteMock.mockResolvedValue({
        isSuccess: false,
        errorMessage: 'Incorrect password',
      });

      const result = await controller.updatePat(dto);

      expect(result).toEqual(UpdatePatResponseDTO.failure('Incorrect password'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Impossible to update pat');
    });

    it('should return failure with default message when errorMessage is missing', async () => {
      updatePatExecuteMock.mockResolvedValue({ isSuccess: false });

      const result = await controller.updatePat(dto);

      expect(result).toEqual(UpdatePatResponseDTO.failure('Impossible to update the pat'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Impossible to update pat');
    });

    it('should catch Error instances and return their message', async () => {
      updatePatExecuteMock.mockRejectedValue(new Error('Write conflict'));

      const result = await controller.updatePat(dto);

      expect(result).toEqual(UpdatePatResponseDTO.failure('Write conflict'));
    });

    it('should catch non-Error thrown values and return Internal Server Error', async () => {
      updatePatExecuteMock.mockRejectedValue({ error: 'weird error object' });

      const result = await controller.updatePat(dto);

      expect(result).toEqual(UpdatePatResponseDTO.failure('Internal Server Error'));
    });
  });
});
