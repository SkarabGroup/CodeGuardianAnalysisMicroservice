import { Test, TestingModule } from '@nestjs/testing';
import { AddRepositoryCollectionService } from '../../../../src/analysis/application/services/add-repository-collection.as';
import { AddRepositoryCollectionCommand } from '../../../../src/analysis/application/commands/add-repository-collection-command.command';
import { AddRepositoryCollectionResult } from '../../../../src/analysis/application/results/add-repository-collection-result.result';
import { COLLECTION_DUPLICATE_CHECKER } from '../../../../src/analysis/application/services/github-collection-checker.as';
import { COLLECTION_ADDER_PORT } from '../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import type { ICollectionExistenceChecker } from '../../../../src/analysis/application/services/interfaces/collection-checker.as.interface';
import type { ICollectionAdderPort } from '../../../../src/analysis/application/ports/repositories/add-collection-port.port';

import { v7 as uuid } from 'uuid';
describe('AddRepositoryCollectionService', () => {
  let service: AddRepositoryCollectionService;
  let duplicateChecker: jest.Mocked<ICollectionExistenceChecker>;
  let collectionAdder: jest.Mocked<ICollectionAdderPort>;

  beforeEach(async () => {
    const mockDuplicateChecker: Partial<ICollectionExistenceChecker> = {
      check: jest.fn(),
    };
    const mockCollectionAdder: Partial<ICollectionAdderPort> = {
      addCollection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddRepositoryCollectionService,
        {
          provide: COLLECTION_DUPLICATE_CHECKER,
          useValue: mockDuplicateChecker,
        },
        {
          provide: COLLECTION_ADDER_PORT,
          useValue: mockCollectionAdder,
        },
      ],
    }).compile();

    service = module.get<AddRepositoryCollectionService>(AddRepositoryCollectionService);
    duplicateChecker = module.get(COLLECTION_DUPLICATE_CHECKER);
    collectionAdder = module.get(COLLECTION_ADDER_PORT);
  });

  const validCommand = new AddRepositoryCollectionCommand({
    user: uuid(),
    repoUrl: 'https://github.com/owner/repo',
    collectionName: 'My Collection',
    description: 'A test description',
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return failure if the collection already exists', async () => {
    duplicateChecker.check.mockResolvedValue(true);

    const result: AddRepositoryCollectionResult = await service.execute(validCommand);

    expect(result.added).toBe(false);
    expect(result.message).toBe('Collection for repository already exists');

    // SOLUZIONE: Accedi alla proprietà mock invece di passare il metodo
    expect(duplicateChecker.check.mock.calls.length).toBeGreaterThan(0);
    expect(collectionAdder.addCollection.mock.calls.length).toBe(0);
  });

  it('should successfully add a collection if it does not exist', async () => {
    duplicateChecker.check.mockResolvedValue(false);
    collectionAdder.addCollection.mockResolvedValue(undefined);

    const result: AddRepositoryCollectionResult = await service.execute(validCommand);

    expect(result.added).toBe(true);
    // SOLUZIONE: Verifica il conteggio delle chiamate tramite la proprietà mock
    expect(duplicateChecker.check.mock.calls.length).toBe(1);
    expect(collectionAdder.addCollection.mock.calls.length).toBe(1);
  });

  it('should return failure if an error occurs during the process', async () => {
    const errorMessage = 'Database connection error';
    duplicateChecker.check.mockRejectedValue(new Error(errorMessage));

    const result: AddRepositoryCollectionResult = await service.execute(validCommand);

    expect(result.added).toBe(false);
    expect(result.message).toBe(errorMessage);
  });

  it('should handle optional description by defaulting to empty string', async () => {
    const commandWithoutDesc = new AddRepositoryCollectionCommand({
      user: uuid(),
      repoUrl: 'https://github.com/owner/repo',
      collectionName: 'No Desc Repo',
    });

    duplicateChecker.check.mockResolvedValue(false);
    collectionAdder.addCollection.mockResolvedValue(undefined);

    await service.execute(commandWithoutDesc);

    const callArgs = collectionAdder.addCollection.mock.calls[0][0];
    expect(callArgs.description).toBe('');
  });
});
