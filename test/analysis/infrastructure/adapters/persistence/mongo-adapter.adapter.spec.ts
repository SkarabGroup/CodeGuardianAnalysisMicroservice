import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';

import { GitCredential } from '../../../../../src/analysis/infrastructure/adapters/persistence/schema/github-repo-credentials.schema';
import { MongoDBAdapter } from '../../../../../src/analysis/infrastructure/adapters/persistence/mongo-adapter.adapter';
import { GetGitCredentialRequest } from '../../../../../src/analysis/application/DTOs/models/requests/get-git-credential-request.model';
import { PostGitCredentialRequest } from '../../../../../src/analysis/application/DTOs/models/requests/post-git-credential-request.model';
import { RepoURL } from '../../../../../src/analysis/domain/value-objects/repo-url.vo';
import { PATPassword } from '../../../../../src/analysis/domain/value-objects/pat-password.vo';
import { PersonalAccessToken } from '../../../../../src/analysis/domain/value-objects/personal-access-token.vo';

interface MockQuery {
  lean: jest.Mock<MockQuery, []>;
  exec: jest.Mock<Promise<GitCredential | null>, []>;
}

interface MockModel {
  findOne: jest.Mock<MockQuery, [FilterQuery<GitCredential>]>;
  create: jest.Mock<Promise<Partial<GitCredential>>, [Partial<GitCredential>]>;
}

interface MongoError extends Error {
  code: number;
}

describe('MongoDBAdapter (Unit Test)', () => {
  let adapter: MongoDBAdapter;
  let mockModel: MockModel;
  let mockQuery: MockQuery;

  beforeEach(async () => {
    // Setup della catena di query (findOne -> lean -> exec)
    mockQuery = {
      lean: jest.fn().mockReturnThis() as jest.Mock<MockQuery, []>,
      exec: jest.fn() as jest.Mock<Promise<GitCredential | null>, []>,
    };

    // Setup del modello
    mockModel = {
      findOne: jest.fn().mockReturnValue(mockQuery) as jest.Mock<
        MockQuery,
        [FilterQuery<GitCredential>]
      >,
      create: jest.fn() as jest.Mock<Promise<Partial<GitCredential>>, [Partial<GitCredential>]>,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoDBAdapter,
        {
          provide: getModelToken(GitCredential.name, 'DatabaseConnection'),
          useValue: mockModel,
        },
      ],
    }).compile();

    adapter = module.get<MongoDBAdapter>(MongoDBAdapter);
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(MongoDBAdapter);
    });
  });

  describe('authorize', () => {
    const mockRequest = new GetGitCredentialRequest(
      RepoURL.create('https://github.com/owner/repo'),
      PATPassword.create('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
    );

    it('should return a successful response when credentials are found', async () => {
      const mockDbResult = {
        patToken: 'ghp_token_valido',
      } as GitCredential;

      mockQuery.exec.mockResolvedValue(mockDbResult);

      const result = await adapter.authorize(mockRequest);

      expect(result.isAuthorized).toBe(true);
      expect(result.patToken).toBe('ghp_token_valido');
      expect(mockModel.findOne).toHaveBeenCalledWith({
        repoUrl: mockRequest.repoUrl.value,
        password: mockRequest.password.value,
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
    });
  });

  describe('save', () => {
    const mockSaveRequest = new PostGitCredentialRequest(
      RepoURL.create('https://github.com/owner/new-repo'),
      PATPassword.create('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
      PersonalAccessToken.create('ghp_' + 'A'.repeat(36)),
    );

    it('should return success when credential is saved correctly', async () => {
      mockModel.create.mockResolvedValue({
        repoUrl: mockSaveRequest.repoUrl.value,
      });

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockModel.create).toHaveBeenCalledWith({
        repoUrl: mockSaveRequest.repoUrl.value,
        password: mockSaveRequest.password.value,
        patToken: mockSaveRequest.pat.value,
      });
    });

    it('should return failure when a duplicate key error (11000) occurs', async () => {
      const mongoError = new Error('Duplicate key') as MongoError;
      mongoError.code = 11000;
      mockModel.create.mockRejectedValue(mongoError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('già esistenti');
    });

    it('should return failure for generic database errors', async () => {
      const genericError = new Error('Database connection lost');
      mockModel.create.mockRejectedValue(genericError);

      const result = await adapter.save(mockSaveRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Database connection lost');
    });

    it('should return failure when password format violates schema validation', async () => {
      const validationError = new Error('ValidationError: password: Path `password` is invalid');
      validationError.name = 'ValidationError';
      mockModel.create.mockRejectedValue(validationError);

      // Act
      const result = await adapter.save(mockSaveRequest);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('ValidationError');
    });

    it('should handle standard Error objects and return their message', async () => {
      // Arrange
      const standardError = new Error('Database connection failed');
      mockModel.create.mockRejectedValue(standardError);

      // Act
      const result = await adapter.save(mockSaveRequest);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Database connection failed');
    });

    it('should handle non-Error objects and return a default unknown error message', async () => {
      mockModel.create.mockRejectedValue('Stringa di errore brutale');

      // Act
      const result = await adapter.save(mockSaveRequest);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.errorMessage).toContain('Errore sconosciuto');
    });
  });
});
