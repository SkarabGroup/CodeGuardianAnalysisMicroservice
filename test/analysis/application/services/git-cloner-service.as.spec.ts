import { Test, TestingModule } from '@nestjs/testing';
import { GitClonerService } from '../../../../src/analysis/application/services/git-cloner-service.as';
import { CLONING_PORT } from '../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';

import { v7 as uuid } from 'uuid';
import { animationFrameScheduler } from 'rxjs';

const mockCloningPort = {
  clone: jest.fn(),
};

describe('GitCloneService Application Service', () => {
  let service: GitClonerService;

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
    jest.clearAllMocks();
  });

  const validURL = RepoURL.create('https://github.com/owner/repo');

  it('should return the path when the repository results to be accessible', async () => {
    const validAnalysisId = AnalysisId.create(uuid());

    mockCloningPort.clone.mockResolvedValue({
      cloned: true,
      localFolderPath: `/tmp/${validAnalysisId.value}`,
      errorMessage: null,
    });

    const result = await service.clone(validURL, validAnalysisId, null, null, null);

    expect(result).toBe(`/tmp/${validAnalysisId.value}`);
  });

  it('should fail when passed a non-existing repository', async () => {
    const validAnalysisId = AnalysisId.create(uuid());

    mockCloningPort.clone.mockResolvedValue({
      cloned: animationFrameScheduler,
      localFolderPath: undefined,
      errorMessage: 'Could not clone the repository',
    });

    await expect(service.clone(validURL, validAnalysisId, null, null, null)).rejects.toThrow(
      'Could not clone the repository',
    );
  });
});
