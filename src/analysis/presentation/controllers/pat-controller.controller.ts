import { Body, Controller, Delete, Put, Inject, Post } from '@nestjs/common';
import { ADD_NEW_PAT } from '../../application/services/new-pat-service.as';
import type { NewPatUseCase } from '../../application/use-case/new-pat-use-case.uc';
import { PostPatRequestDTO } from '../DTOs/requests/post-pat-request.dto';
import { NewPatCommand } from '../../application/commands/new-pat-command.command';
import { PostPatResponseDTO } from '../DTOs/responses/post-pat-response.dto';

import { DELETE_PAT } from '../../application/services/delete-pat-service.as';
import { DeletePatRequestDTO } from '../DTOs/requests/delete-pat-request.dto';
import { DeletePatResponseDTO } from '../DTOs/responses/delete-pat-response.dto';
import { DeletePatCommand } from '../../application/commands/delete-pat-command.command';
import type { DeletePatUseCase } from '../../application/use-case/delete-pat-use-case.uc';

import { UPDATE_PAT } from '../../application/services/update-pat-service.as';
import { UpdatePatRequestDTO } from '../DTOs/requests/update-pat-request.dto';
import { UpdatePatResponseDTO } from '../DTOs/responses/update-pat-response.dto';
import { UpdatePatCommand } from '../../application/commands/update-pat-command.command';
import type { UpdatePatUseCase } from '../../application/use-case/update-pat-use-case.uc';

@Controller('analysis')
export class PatController {
  constructor(
    @Inject(ADD_NEW_PAT)
    private readonly newPatService: NewPatUseCase,
    @Inject(DELETE_PAT)
    private readonly deletePatService: DeletePatUseCase,
    @Inject(UPDATE_PAT)
    private readonly updatePatService: UpdatePatUseCase,
  ) {}

  @Post('pat')
  async addNewPat(@Body() dto: PostPatRequestDTO): Promise<PostPatResponseDTO> {
    const command = new NewPatCommand({
      repositoryUrl: dto.repositoryUrl,
      patPassword: dto.password,
      personalAccessToken: dto.personalAccessToken,
    });

    try {
      const result = await this.newPatService.execute(command);
      if (!result.isSuccess) {
        console.log('Impossible to add pat');
        return PostPatResponseDTO.failure(result.errorMessage || 'Impossible to Add a new pat');
      }
      return PostPatResponseDTO.success();
    } catch (error) {
      return PostPatResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }
  @Delete('pat')
  async deletePat(@Body() dto: DeletePatRequestDTO): Promise<DeletePatResponseDTO> {
    const command = new DeletePatCommand({
      repositoryUrl: dto.repositoryUrl,
      patPassword: dto.password,
    });

    try {
      const result = await this.deletePatService.execute(command);
      if (!result.isSuccess) {
        console.log('Impossible to delete pat');
        return DeletePatResponseDTO.failure(result.errorMessage || 'Impossible to delete the pat');
      }
      return DeletePatResponseDTO.success();
    } catch (error) {
      return DeletePatResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @Put('pat')
  async updatePat(@Body() dto: UpdatePatRequestDTO): Promise<UpdatePatResponseDTO> {
    const command = new UpdatePatCommand({
      repositoryUrl: dto.repositoryUrl,
      patPassword: dto.password,
      newPat: dto.newPersonalAccessToken,
    });

    try {
      const result = await this.updatePatService.execute(command);
      if (!result.isSuccess) {
        console.log('Impossible to update pat');
        return UpdatePatResponseDTO.failure(result.errorMessage || 'Impossible to update the pat');
      }
      return UpdatePatResponseDTO.success();
    } catch (error) {
      return UpdatePatResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }
}
