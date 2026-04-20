import { Test, TestingModule } from '@nestjs/testing';

import { GitValidatorService } from '../../../../src/analysis/application/services/git-validator-service.as';
import { AVAILABILITY_PORT } from '../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';

import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { BranchName } from '../../../../src/analysis/domain/value-objects/branch-name.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';
import { PersonalAccessToken } from '../../../../src/analysis/domain/value-objects/personal-access-token.vo';

describe('GitValidatorService', () => {
  let service: GitValidatorService;

  const mockAvailabilityPort = {
    check: jest.fn(),
  };

  const url = RepoURL.create('https://github.com/owner/repo');
  const branch = BranchName.create('develop');
  const commit = CommitHash.create('a'.repeat(40));
  const pat = PersonalAccessToken.create('ghp_' + 'A'.repeat(36));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitValidatorService,
        { provide: AVAILABILITY_PORT, useValue: mockAvailabilityPort },
      ],
    }).compile();

    service = module.get<GitValidatorService>(GitValidatorService);

    jest.resetAllMocks();
  });

  describe('CommitValidationStrategy', () => {
    it('should succeed when commit is accessible', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: true,
        branch: 'main',
        commit: commit.value,
      });

      const result = await service.check(url, pat, null, commit);

      expect(result.commit.value).toBe(commit.value);
      expect(result.branch.value).toBe('main');
    });

    it('should throw if commit not accessible', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: false,
        branch: null,
        commit: null,
        errorMessage: 'Commit not found',
      });

      await expect(service.check(url, pat, null, commit)).rejects.toThrow('Commit not found');
    });

    it('should fallback error message if none provided', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: false,
        branch: null,
        commit: null,
      });

      await expect(service.check(url, pat, null, commit)).rejects.toThrow(
        `Commit ${commit.value} not accessible`,
      );
    });
  });

  describe('BranchValidationStrategy', () => {
    it('should succeed when branch is accessible', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: true,
        branch: branch.value,
        commit: 'b'.repeat(40),
      });

      const result = await service.check(url, pat, branch, null);

      expect(result.branch.value).toBe(branch.value);
    });

    it('should throw if branch not accessible', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: false,
        branch: null,
        commit: null,
        errorMessage: 'Branch not found',
      });

      await expect(service.check(url, pat, branch, null)).rejects.toThrow('Branch not found');
    });

    it('should fallback error message', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: false,
        branch: null,
        commit: null,
      });

      await expect(service.check(url, pat, branch, null)).rejects.toThrow(
        `Branch ${branch.value} not accessible`,
      );
    });
  });
  describe('DefaultValidationStrategy', () => {
    it('should succeed when repo is accessible and commit is available', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: true,
        branch: 'main',
        commit: 'c'.repeat(40),
      });

      const result = await service.check(url, pat, null, null);

      expect(result.branch.value).toBe('main');
    });

    it('should throw if repository not accessible', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: false,
        branch: null,
      });

      await expect(service.check(url, pat, null, null)).rejects.toThrow(
        'Repository not accessible',
      );
    });

    it('should resolve PENDING commit with second call', async () => {
      mockAvailabilityPort.check
        .mockResolvedValueOnce({
          isAccessible: true,
          branch: 'main',
          commit: 'PENDING',
        })
        .mockResolvedValueOnce({
          isAccessible: true,
          branch: 'main',
          commit: 'd'.repeat(40),
        });

      const result = await service.check(url, pat, null, null);

      expect(result.commit.value).toBe('d'.repeat(40));
      expect(mockAvailabilityPort.check).toHaveBeenCalledTimes(2);
    });

    it('should throw if second call fails in PENDING resolution', async () => {
      mockAvailabilityPort.check
        .mockResolvedValueOnce({
          isAccessible: true,
          branch: 'main',
          commit: 'PENDING',
        })
        .mockResolvedValueOnce({
          isAccessible: false,
          branch: null,
          commit: null,
        });

      await expect(service.check(url, pat, null, null)).rejects.toThrow(
        'Failed to resolve default branch commit',
      );
    });
  });

  describe('Strategy Selection', () => {
    it('should prioritize commit over branch', async () => {
      mockAvailabilityPort.check.mockResolvedValue({
        isAccessible: true,
        branch: 'main',
        commit: commit.value,
      });

      await service.check(url, pat, branch, commit);
      expect(mockAvailabilityPort.check).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should propagate port errors', async () => {
      mockAvailabilityPort.check.mockRejectedValue(new Error('Network error'));

      await expect(service.check(url, pat, null, null)).rejects.toThrow('Network error');
    });
  });

  it('should be correctly instantiated', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(GitValidatorService);
  });
});
