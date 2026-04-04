import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityChecker } from '../../../../src/analysis/domain/services/availability-checker.ds';
import { GITHUB_AVAILABILITY_PORT } from '../../../../src/analysis/infrastructure/adapters/externals/github-adapter.adapter';
import { RepoURL } from '../../../../src/analysis/domain/value-objects/repo-url.vo';
import { CommitHash } from '../../../../src/analysis/domain/value-objects/commit-hash.vo';

const mockAvailabilityPort = {
  check: jest.fn(),
};

describe('AvailabilityChecker Domain Service', () => {
  let service: AvailabilityChecker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityChecker,
        { provide: GITHUB_AVAILABILITY_PORT, useValue: mockAvailabilityPort },
      ],
    }).compile();

    service = module.get<AvailabilityChecker>(AvailabilityChecker);
    jest.clearAllMocks();
  });

  const validUrl = RepoURL.create('https://github.com/owner/repo');

  it('should return CommitHash resolved by the availability port', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      errorMessage: null,
      commit: 'a'.repeat(40),
    });

    const result = await service.check(validUrl, null, null, null);

    expect(result.value).toBe('a'.repeat(40));
  });

  it('should fallback to input CommitHash if port does not return one', async () => {
    const inputCommit = CommitHash.create('a'.repeat(40));
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      errorMessage: null,
      commit: null,
    });

    const result = await service.check(validUrl, null, null, inputCommit);

    expect(result.value).toBe('a'.repeat(40));
  });

  it('should throw an error if repository is not accessible', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: false,
      errorMessage: 'Repo Private or Not Found',
      commit: null,
    });

    await expect(service.check(validUrl, null, null, null)).rejects.toThrow(
      'Repo Private or Not Found',
    );
  });

  it('should throw a default error if not accessible and no message is provided', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: false,
      errorMessage: null,
      commit: null,
    });

    await expect(service.check(validUrl, null, null, null)).rejects.toThrow(
      'Source repository is not accessible',
    );
  });

  it('should throw an error if no valid commit hash can be resolved', async () => {
    mockAvailabilityPort.check.mockResolvedValue({
      isAccessible: true,
      errorMessage: null,
      commit: null, // Nessuno SHA restituito
    });

    // Passiamo null anche come inputCommit
    await expect(service.check(validUrl, null, null, null)).rejects.toThrow(
      'Could not resolve a valid commit hash for this analysis',
    );
  });

  it('should propagate errors thrown by the port', async () => {
    mockAvailabilityPort.check.mockRejectedValue(new Error('Network Timeout'));

    await expect(service.check(validUrl, null, null, null)).rejects.toThrow('Network Timeout');
  });
});
