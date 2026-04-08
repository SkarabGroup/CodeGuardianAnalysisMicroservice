import { Test, TestingModule } from '@nestjs/testing';

import { GitClonerService } from '../../../../src/analysis/application/services/git-cloner-service.as';
import { CLONING_PORT } from '../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';

import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';
import { BranchName } from '../../../../src/analysis/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';

import { v7 as uuid } from 'uuid';

describe('GitClonerService', () => {
  let service: GitClonerService;

  const mockCloningPort = {
    clone: jest.fn(),
  };

  const validURL = RepoURL.create('https://github.com/owner/repo');
  const validAnalysisId = AnalysisId.create(uuid());
  const validToken = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));
  const validBranch = BranchName.create('main');
  const validCommit = CommitHash.create('a'.repeat(40));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitClonerService,
        {
          provide: CLONING_PORT,
          useValue: mockCloningPort,
        },
      ],
    }).compile();

    service = module.get<GitClonerService>(GitClonerService);

    jest.resetAllMocks();
  });

  it('should return path when clone succeeds', async () => {
    const expectedPath = `/tmp/${validAnalysisId.value}`;

    mockCloningPort.clone.mockResolvedValue({
      cloned: true,
      localFolderPath: expectedPath,
      errorMessage: null,
    });

    const result = await service.clone(
      validURL,
      validAnalysisId,
      validToken,
      validBranch,
      validCommit,
    );

    expect(result).toBe(expectedPath);
  });

  it('should throw if cloned is false', async () => {
    mockCloningPort.clone.mockResolvedValue({
      cloned: false,
      localFolderPath: '/tmp/test',
      errorMessage: null,
    });

    await expect(service.clone(validURL, validAnalysisId, null, null, null)).rejects.toThrow(
      'Could not clone the repository',
    );
  });

  it('should throw if path is missing', async () => {
    mockCloningPort.clone.mockResolvedValue({
      cloned: true,
      localFolderPath: null,
      errorMessage: null,
    });

    await expect(service.clone(validURL, validAnalysisId, null, null, null)).rejects.toThrow(
      'Could not clone the repository',
    );
  });

  it('should throw specific error message if provided', async () => {
    mockCloningPort.clone.mockResolvedValue({
      cloned: false,
      localFolderPath: null,
      errorMessage: 'Repository not found',
    });

    await expect(service.clone(validURL, validAnalysisId, null, null, null)).rejects.toThrow(
      'Repository not found',
    );
  });

  it('should call cloningPort with correct request object', async () => {
    mockCloningPort.clone.mockResolvedValue({
      cloned: true,
      localFolderPath: '/tmp/test',
    });

    await service.clone(validURL, validAnalysisId, validToken, validBranch, validCommit);

    expect(mockCloningPort.clone).toHaveBeenCalledTimes(1);
  });

  it('should work with null optional parameters', async () => {
    mockCloningPort.clone.mockResolvedValue({
      cloned: true,
      localFolderPath: '/tmp/test',
    });

    const result = await service.clone(validURL, validAnalysisId, null, null, null);

    expect(result).toBe('/tmp/test');
  });

  it('should propagate errors from cloningPort', async () => {
    mockCloningPort.clone.mockRejectedValue(new Error('Network failure'));

    await expect(service.clone(validURL, validAnalysisId, null, null, null)).rejects.toThrow(
      'Network failure',
    );
  });

  it('should be correctly instantiated', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(GitClonerService);
  });
});
