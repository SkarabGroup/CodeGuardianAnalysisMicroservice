import { Test, TestingModule } from '@nestjs/testing';
import { GitValidatorService } from '../../../../src/analysis/application/services/git-validator-service.as';
import { AVAILABILITY_PORT } from '../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../../src/analysis/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';

const mockAvailabilityPort = {
  check: jest.fn(),
};

describe('GitValidatorService', () => {
  let service: GitValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitValidatorService,
        { provide: AVAILABILITY_PORT, useValue: mockAvailabilityPort },
      ],
    }).compile();

    service = module.get<GitValidatorService>(GitValidatorService);
    jest.clearAllMocks();
  });

  const url = RepoURL.create('https://github.com/owner/repo');
  const commit = CommitHash.create('a'.repeat(40));
  const branch = BranchName.create('develop');

  it('should use CommitValidationStrategy when commit is provided', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      branch: 'main',
      commit: commit.value,
    });

    const result = await service.check(url, null, null, commit);

    expect(result.commit.value).toBe(commit.value);
    expect(mockAvailabilityPort.check).toHaveBeenCalledWith(
      expect.objectContaining({ commit: commit }),
    );
  });

  it('should use BranchValidationStrategy when only branch is provided', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      branch: branch.value,
      commit: 'b'.repeat(40),
    });

    const result = await service.check(url, null, branch, null);

    expect(result.branch.value).toBe(branch.value);
    expect(mockAvailabilityPort.check).toHaveBeenCalledWith(
      expect.objectContaining({ branch: branch, commit: null }),
    );
  });

  it('should use DefaultValidationStrategy when neither branch nor commit are provided', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      branch: 'master',
      commit: 'c'.repeat(40),
    });

    const result = await service.check(url, null, null, null);

    expect(result.branch.value).toBe('master');
    expect(mockAvailabilityPort.check).toHaveBeenCalledWith(
      expect.objectContaining({ branch: null, commit: null }),
    );
  });

  it('should throw if the port reports the repository is not accessible', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: false,
      errorMessage: 'Not Found',
    });

    await expect(service.check(url, null, null, null)).rejects.toThrow('Not Found');
  });
});
