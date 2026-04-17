import { Test, TestingModule } from '@nestjs/testing';
import { GitHubCollectionGetter } from '../../../../src/analysis/application/services/github-collection-getter.as';
import { GetRepositoryCollectionCommand } from '../../../../src/analysis/application/commands/get-repository-collection-command.command';
import { COLLECTION_GETTER_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GetRepositoryCollectionResponse } from '../../../../src/analysis/application/DTOs/models/responses/get-repository-collection-response.model';

import { v7 as uuid } from 'uuid';
describe('GitHubCollectionGetter', () => {
  let service: GitHubCollectionGetter;

  const mockGetterPort = {
    getRepositoryCollection: jest.fn(),
  };

  const validCommand = new GetRepositoryCollectionCommand({
    url: 'https://github.com/owner/repo',
    user: uuid(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubCollectionGetter,
        {
          provide: COLLECTION_GETTER_PORT,
          useValue: mockGetterPort,
        },
      ],
    }).compile();

    service = module.get<GitHubCollectionGetter>(GitHubCollectionGetter);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return success result with payload when collection is found', async () => {
      const mockResponse = GetRepositoryCollectionResponse.success({
        url: 'https://github.com/owner/repo',
        name: 'My Repo',
        description: 'Test',
        analyses: ['id-1', 'id-2'],
      });
      mockGetterPort.getRepositoryCollection.mockResolvedValue(mockResponse);

      const result = await service.execute(validCommand);

      expect(result.success).toBe(true);
      expect(result.name).toBe('My Repo');
      expect(result.analyses).toHaveLength(2);
    });

    it('should return failure when port indicates lack of success', async () => {
      mockGetterPort.getRepositoryCollection.mockResolvedValue(
        GetRepositoryCollectionResponse.failure('Collection not found'),
      );

      const result = await service.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('should return default failure message if port success is false without message', async () => {
      mockGetterPort.getRepositoryCollection.mockResolvedValue({ success: false });

      const result = await service.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Impossible to get the collection');
    });

    it('should catch exceptions and map them to failure result', async () => {
      mockGetterPort.getRepositoryCollection.mockRejectedValue(new Error('Network failure'));

      const result = await service.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network failure');
    });
  });
});
