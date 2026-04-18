import { Body, Controller, Delete, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, UserId } from './helper/jwt-guard.helper';

import { AddRepositoryCollectionRequestDTO } from '../DTOs/requests/add-repository-collection-request.dto';
import { DeleteRepositoryCollectionResponseDTO } from '../DTOs/responses/delete-repository-collection-response.dto';
import { AddRepositoryCollectionResponseDTO } from '../DTOs/responses/add-repository-collection-response.dto';
import { GetRepositoryCollectionResponseDTO } from '../DTOs/responses/get-repository-collection-response.dto';
import { GetAnalysisResponseDTO } from '../DTOs/responses/get-analysis-by-id.dto';
import { GetAllAnalysesForUserResponseDTO } from '../DTOs/responses/get-all-analyses-for-user-response.dto';

import { AddRepositoryCollectionCommand } from '../../application/commands/add-repository-collection-command.command';
import { DeleteRepositoryCollectionCommand } from '../../application/commands/delete-repository-collection-command.command';
import { GetRepositoryCollectionCommand } from '../../application/commands/get-repository-collection-command.command';
import { GetAnalysisFromIdCommand } from '../../application/commands/get-analysis-from-id.command';
import { GetAllAnalysesForUserCommand } from '../../application/commands/get-all-analyses-for-user-command.command';

import type { AddRepositoryCollectionUseCase } from '../../application/use-case/add-repository-collection-use-case.uc';
import type { GetRepositoryCollectionUseCase } from '../../application/use-case/get-repository-collection-use-case.uc';
import type { DeleteRepositoryCollectionUseCase } from '../../application/use-case/delete-repository-collection-use-case.uc';
import type { GetAnalysisUseCase } from '../../application/use-case/get-analysis-use-case.uc';
import type { GetAllAnalysesForUserUseCase } from '../../application/use-case/get-all-analyses-for-user.uc';

import { AddRepositoryCollectionResult } from '../../application/results/add-repository-collection-result.result';
import { GetRepositoryCollectionResult } from '../../application/results/get-repository-collection-result.result';
import { DeleteRepositoryCollectionResult } from '../../application/results/delete-repository-collection-result.result';

import { GET_COLLECTION_SERVICE } from '../../application/services/github-collection-getter.as';
import { DELETE_COLLECTION_SERVICE } from '../../application/services/github-collection-deleter.as';
import { ADD_COLLECTION_SERVICE } from '../../application/services/add-repository-collection.as';
import {
  GET_ANALYSIS_SERVICE,
  GET_ALL_ANALYSES_FOR_USER_SERVICE,
} from '../../application/services/get-analysis-service.as';
import { GetFullRepositoryCollectionDetailsResponseDTO } from '../DTOs/responses/get-all-analysis-from-collection-response.dto';
import {
  GetAllRepositoryCollectionsResponseDTO,
  RepositoryCollectionItemDTO,
} from '../DTOs/responses/get-all-repository-collections-response.dto';
import { GetAllRepositoryCollectionsCommand } from '../../application/commands/get-all-repository-collections-command.command';
import { GetAllRepositoryCollectionsUseCase } from '../../application/use-case/get-all-repository-collection-use-case.uc';

@Controller('repositories')
export class RepositoriesController {
  constructor(
    @Inject(ADD_COLLECTION_SERVICE)
    private readonly repoCollectionAdder: AddRepositoryCollectionUseCase,
    @Inject(GET_COLLECTION_SERVICE)
    private readonly repoCollectionGetter: GetRepositoryCollectionUseCase &
      GetAllRepositoryCollectionsUseCase,
    @Inject(DELETE_COLLECTION_SERVICE)
    private readonly repoCollectionDeleter: DeleteRepositoryCollectionUseCase,
    @Inject(GET_ANALYSIS_SERVICE)
    private readonly getAnalysis: GetAnalysisUseCase,
    @Inject(GET_ALL_ANALYSES_FOR_USER_SERVICE)
    private readonly getAllAnalyses: GetAllAnalysesForUserUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  public async addRepositoryCollection(
    @Body() dto: AddRepositoryCollectionRequestDTO,
    @UserId() id: string,
  ): Promise<AddRepositoryCollectionResponseDTO> {
    try {
      const command = new AddRepositoryCollectionCommand({
        user: id,
        repoUrl: dto.url,
        collectionName: dto.name,
        description: dto.description || undefined,
      });

      const result: AddRepositoryCollectionResult = await this.repoCollectionAdder.execute(command);

      if (!result.added) {
        return AddRepositoryCollectionResponseDTO.failure(
          result.message || 'Impossible to add this collection',
        );
      }

      return AddRepositoryCollectionResponseDTO.success();
    } catch (error) {
      return AddRepositoryCollectionResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('all-analyses')
  public async getAllAnalysesForUser(
    @UserId() userId: string,
  ): Promise<GetAllAnalysesForUserResponseDTO> {
    const command = new GetAllAnalysesForUserCommand(userId);
    try {
      const result = await this.getAllAnalyses.getAllAnalysesForUser(command);
      return GetAllAnalysesForUserResponseDTO.fromResult(result);
    } catch (error) {
      return new GetAllAnalysesForUserResponseDTO(
        false,
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('all-collections')
  public async getAllCollections(
    @UserId() id: string,
  ): Promise<GetAllRepositoryCollectionsResponseDTO> {
    try {
      const command = new GetAllRepositoryCollectionsCommand(id);

      const result = await this.repoCollectionGetter.executeAll(command);

      if (!result.success) {
        return GetAllRepositoryCollectionsResponseDTO.failure(
          result.message || 'Impossible to retrieve collections',
        );
      }

      const dtos = result.collections.map(
        (c) => new RepositoryCollectionItemDTO(c.url, c.name, c.description ?? undefined),
      );

      return GetAllRepositoryCollectionsResponseDTO.success(dtos);
    } catch (error) {
      return GetAllRepositoryCollectionsResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('single/:url')
  public async getCollectionFromUrl(
    @Param('url') url: string,
    @UserId() id: string,
  ): Promise<GetRepositoryCollectionResponseDTO> {
    try {
      const decodedUrl = decodeURIComponent(url);
      const command = new GetRepositoryCollectionCommand({
        user: id,
        url: decodedUrl,
      });

      const result: GetRepositoryCollectionResult =
        await this.repoCollectionGetter.execute(command);

      if (!result.success) {
        return GetRepositoryCollectionResponseDTO.failure(
          result.message || 'Impossible to get the collection',
        );
      }
      return GetRepositoryCollectionResponseDTO.success({
        url: result.url,
        name: result.name,
        description: result.description ?? '',
        analyses: result.analyses ?? [],
      });
    } catch (error) {
      return GetRepositoryCollectionResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('analysis/:id')
  public async getAnalysisById(@Param('id') id: string): Promise<GetAnalysisResponseDTO> {
    const command = new GetAnalysisFromIdCommand(id);
    try {
      const result = await this.getAnalysis.execute(command);
      return GetAnalysisResponseDTO.fromResult(result);
    } catch (error) {
      return new GetAnalysisResponseDTO(
        false,
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':url')
  public async deleteCollection(
    @Param('url') url: string,
    @UserId() id: string,
  ): Promise<DeleteRepositoryCollectionResponseDTO> {
    try {
      const decodedUrl = decodeURIComponent(url);
      const command = new DeleteRepositoryCollectionCommand({
        user: id,
        url: decodedUrl,
      });

      const result: DeleteRepositoryCollectionResult =
        await this.repoCollectionDeleter.execute(command);

      if (!result.deleted) {
        return DeleteRepositoryCollectionResponseDTO.failure(
          result.message || 'Collection not found or already deleted',
        );
      }

      return DeleteRepositoryCollectionResponseDTO.success();
    } catch (error) {
      return DeleteRepositoryCollectionResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('full-details/:url')
  public async getFullCollectionData(
    @Param('url') url: string,
    @UserId() id: string,
  ): Promise<GetFullRepositoryCollectionDetailsResponseDTO> {
    try {
      const decodedUrl = decodeURIComponent(url);

      const collectionCommand = new GetRepositoryCollectionCommand({
        user: id,
        url: decodedUrl,
      });
      const collectionResult = await this.repoCollectionGetter.execute(collectionCommand);

      if (!collectionResult.success || !collectionResult.analyses) {
        return GetFullRepositoryCollectionDetailsResponseDTO.failure(
          collectionResult.message || 'Collection not found',
        );
      }

      const detailedAnalysesPromises = collectionResult.analyses.map((analysisId) =>
        this.getAnalysis.execute(new GetAnalysisFromIdCommand(analysisId)),
      );

      const detailedResults = await Promise.all(detailedAnalysesPromises);

      return GetFullRepositoryCollectionDetailsResponseDTO.success({
        url: collectionResult.url,
        name: collectionResult.name,
        description: collectionResult.description ?? null,
        analyses: detailedResults.map((res) => GetAnalysisResponseDTO.fromResult(res)),
      });
    } catch (error) {
      return GetFullRepositoryCollectionDetailsResponseDTO.failure(
        error instanceof Error ? error.message : 'Internal Server Error',
      );
    }
  }
}
