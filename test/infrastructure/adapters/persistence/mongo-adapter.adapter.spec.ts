import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';

import { GitCredential } from '../../../../src/infrastructure/adapters/persistence/schema/github-repo-credentials.schema';
import { GetGitCredentialRequest } from '../../../../src/application/DTOs/models/requests/get-git-credential-request.model';
import { MongoDBAdapter } from '../../../../src/infrastructure/adapters/persistence/mongo-adapter.adapter';

// Interfaccia per simulare la catena di Mongoose
interface MockQuery {
  lean: jest.Mock<MockQuery, []>;
  exec: jest.Mock<Promise<GitCredential | null>, []>;
}

// Interfaccia per il Modello
interface MockModel {
  findOne: jest.Mock<MockQuery, [FilterQuery<GitCredential>]>;
}

describe('MongoDBAdapter (Unit Test)', () => {
  let adapter: MongoDBAdapter;
  let mockModel: MockModel;
  let mockQuery: MockQuery;

  beforeEach(async () => {
    mockQuery = {
      lean: jest.fn().mockReturnThis() as jest.Mock<MockQuery, []>,
      exec: jest.fn() as jest.Mock<Promise<GitCredential | null>, []>,
    };

    mockModel = {
      findOne: jest.fn().mockReturnValue(mockQuery) as jest.Mock<
        MockQuery,
        [FilterQuery<GitCredential>]
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoDBAdapter,
        {
          provide: getModelToken(GitCredential.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    adapter = module.get<MongoDBAdapter>(MongoDBAdapter);
  });

  describe('istantiation', () => {
    it('should be defined', () => {
      expect(adapter).toBeDefined();
    });
  });

  describe('authorize', () => {
    const mockRequest = new GetGitCredentialRequest('https://github.com/repo', 'password123');

    it('should return a successful response when credentials are found', async () => {
      const mockDbResult = {
        patToken: 'ghp_token_valido',
      };

      mockQuery.exec.mockResolvedValue(mockDbResult);

      const result = await adapter.authorize(mockRequest);

      expect(result.isAuthorized).toBe(true);
      expect(result.patToken).toBe('ghp_token_valido');
      expect(mockModel.findOne).toHaveBeenCalledWith({
        repoUrl: mockRequest.repoUrl,
        password: mockRequest.password,
      });
    });

    it('should return unauthorized response when credentials are not found', async () => {
      mockQuery.exec.mockResolvedValue(null);

      const result = await adapter.authorize(mockRequest);

      expect(result.isAuthorized).toBe(false);
      expect(result.patToken).toBeNull();
      expect(result.errorMessage).toBe('Credenziali non trovate o password errata');
    });

    it('should return error response when database throws an exception', async () => {
      const dbError = new Error('Connection timeout');
      mockQuery.exec.mockRejectedValue(dbError);

      const result = await adapter.authorize(mockRequest);

      expect(result.isAuthorized).toBe(false);
      expect(result.errorMessage).toContain('Errore di connessione al database');
      expect(result.errorMessage).toContain('Connection timeout');
    });
  });
});
