import { Test, TestingModule } from '@nestjs/testing';
import { GitHubCollectionDeleter } from '../../../../src/analysis/application/services/github-collection-deleter.as';
import { DeleteRepositoryCollectionCommand } from '../../../../src/analysis/application/commands/delete-repository-collection-command.command';
import { COLLECTION_DELETER_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { DeleteRepositoryCollectionResponse } from '../../../../src/analysis/application/DTOs/models/responses/delete-repository-collection-response.model';

import { v7 as uuid } from 'uuid';
describe('GitHubCollectionDeleter', () => {
  let service: GitHubCollectionDeleter;

  const mockDeleterPort = {
    deleteCollection: jest.fn(),
  };

  const validCommand = new DeleteRepositoryCollectionCommand({
    url: 'https://github.com/owner/repo',
    user: uuid(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubCollectionDeleter,
        {
          provide: COLLECTION_DELETER_PORT,
          useValue: mockDeleterPort,
        },
      ],
    }).compile();

    service = module.get<GitHubCollectionDeleter>(GitHubCollectionDeleter);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  describe('execute', () => {
    it('should return success when port successfully deletes the collection', async () => {
      mockDeleterPort.deleteCollection.mockResolvedValue(
        DeleteRepositoryCollectionResponse.success(),
      );

      const result = await service.execute(validCommand);

      expect(result.deleted).toBe(true);
      expect(mockDeleterPort.deleteCollection).toHaveBeenCalled();
    });

    it('should return failure when port fails to delete', async () => {
      mockDeleterPort.deleteCollection.mockResolvedValue(
        DeleteRepositoryCollectionResponse.failure('Not Found'),
      );

      const result = await service.execute(validCommand);

      expect(result.deleted).toBe(false);
      expect(result.message).toBe('Not Found');
    });

    it('should return default failure message if port fails without message', async () => {
      mockDeleterPort.deleteCollection.mockResolvedValue({ deleted: false });

      const result = await service.execute(validCommand);

      expect(result.deleted).toBe(false);
      expect(result.message).toBe('Impossible to delete the collection');
    });

    it('should catch exceptions and return failure result', async () => {
      mockDeleterPort.deleteCollection.mockRejectedValue(new Error('DB Error'));

      const result = await service.execute(validCommand);

      expect(result.deleted).toBe(false);
      expect(result.message).toBe('DB Error');
    });
  });
});
