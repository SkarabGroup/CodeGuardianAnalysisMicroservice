import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ADD_NEW_PAT } from "../../application/services/new-pat-service.as";
import type { NewPatUseCase } from "../../application/use-case/new-pat-use-case.uc";
import { PostPatRequestDTO } from "../DTOs/requests/post-pat-request.dto";
import { NewPatCommand } from "../../application/commands/new-pat-command.command";
import { PostPatResponseDTO } from "../DTOs/responses/post-pat-response.dto";

@Controller('analysis')
export class PatController {
    constructor(
        @Inject(ADD_NEW_PAT)
        private readonly patService: NewPatUseCase
    ) {}

    @Post('pat')
    async addNewPat(@Body() dto: PostPatRequestDTO) : Promise<PostPatResponseDTO> {
      const command = new NewPatCommand({
        repositoryUrl: dto.repositoryUrl,
        patPassword: dto.password,
        personalAccessToken: dto.personalAccessToken
      });

      try {
        const result = await this.patService.execute(command);
        if(!result.isSuccess) {
            console.log('Impossibile aggiungere il pat');
            return PostPatResponseDTO.failure(
              result.errorMessage || 'Impossible to Add a new pat'
            );
        }
        return PostPatResponseDTO.success();

      } catch(error) {
        return PostPatResponseDTO.failure(
          error instanceof Error ? error.message : 'Internal Server Error',
        );
      }
    }
}