import { Test, TestingModule } from '@nestjs/testing';
import { GitHubCollectionChecker } from '../../../../src/analysis/application/services/github-collection-checker.as';
import { COLLECTION_DUPLICATE_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { UserId } from '../../../../src/analysis/domain/value-objects/user-id.vo';
import { CheckCollectionDuplicateResponse } from '../../../../src/analysis/application/DTOs/models/responses/check-collection-duplicate-response.model';
import type { ICollectionDuplicateCheckerPort } from '../../../../src/analysis/application/ports/repositories/collection-duplicate-checker-port.port';

import { v7 as uuid } from 'uuid';
describe('GitHubCollectionChecker', () => {
  let service: GitHubCollectionChecker;
  let port: jest.Mocked<ICollectionDuplicateCheckerPort>;

  const mockUser = UserId.create(uuid());
  const mockUrl = RepoURL.create('https://github.com/owner/repo');

  beforeEach(async () => {
    const mockPort: Partial<ICollectionDuplicateCheckerPort> = {
      checkDuplicate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubCollectionChecker,
        {
          provide: COLLECTION_DUPLICATE_PORT,
          useValue: mockPort,
        },
      ],
    }).compile();

    service = module.get<GitHubCollectionChecker>(GitHubCollectionChecker);
    port = module.get(COLLECTION_DUPLICATE_PORT);
  });

  it('should return true if duplicate exists', async () => {
    port.checkDuplicate.mockResolvedValue(new CheckCollectionDuplicateResponse(true));

    const result = await service.check(mockUser, mockUrl);

    expect(result).toBe(true);
    // FIX: Verifica la lunghezza dell'array di chiamate
    expect(port.checkDuplicate.mock.calls.length).toBe(1);
  });

  it('should return false if duplicate does not exist', async () => {
    port.checkDuplicate.mockResolvedValue(new CheckCollectionDuplicateResponse(false));

    const result = await service.check(mockUser, mockUrl);

    expect(result).toBe(false);
    expect(port.checkDuplicate.mock.calls.length).toBe(1);
  });

  it('should throw if port throws', async () => {
    port.checkDuplicate.mockRejectedValue(new Error('DB Error'));

    await expect(service.check(mockUser, mockUrl)).rejects.toThrow('DB Error');
  });
});
