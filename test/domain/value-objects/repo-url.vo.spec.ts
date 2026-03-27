import { RepoURL } from '../../../src/domain/value-objects/repo-url.vo';

describe('RepoURL Value Object', () => {
  const VALID_URL = 'https://github.com/user/repo';

  describe('Success Cases', () => {
    it('should create a valid RepoURL instance', () => {
      const repo = RepoURL.create(VALID_URL);
      expect(repo.getValue()).toBe(VALID_URL);
    });

    it('should trim whitespace from the input', () => {
      const repo = RepoURL.create('   ' + VALID_URL + '   ');
      expect(repo.getValue()).toBe(VALID_URL);
    });
  });

  describe('Failure Cases', () => {
    it('should fail if the string is empty or only whitespace', () => {
      expect(() => RepoURL.create('')).toThrow('Must be passed a string');

      expect(() => RepoURL.create('   ')).toThrow('Must be passed a string');
    });

    it('should fail if missing double slashes (structural error)', () => {
      expect(() => RepoURL.create('https:github.com/user/repo')).toThrow(
        'The provided string origin is not a valid URL',
      );
    });

    it('should fail if the protocol is not HTTPS', () => {
      expect(() => RepoURL.create('http://github.com/user/repo')).toThrow(
        'The provided string origin is not a valid URL',
      );
    });

    it('should fail if the host is not github.com', () => {
      expect(() => RepoURL.create('https://gitlab.com/user/repo')).toThrow(
        "URL must be of 'github.com'",
      );
    });

    it('should fail if the repository path is incomplete', () => {
      expect(() => RepoURL.create('https://github.com/')).toThrow(
        'The number of parameters in the pathname is insufficient',
      );

      expect(() => RepoURL.create('https://github.com/user')).toThrow(
        'The number of parameters in the pathname is insufficient',
      );
    });

    it('should fail for completely invalid strings', () => {
      expect(() => RepoURL.create('not-an-url')).toThrow(
        'The provided string origin is not a valid URL',
      );
    });
  });

  describe('Equality', () => {
    it('should return true if two RepoURLs have the same value', () => {
      const url1 = RepoURL.create(VALID_URL);
      const url2 = RepoURL.create(VALID_URL);
      expect(url1.equals(url2)).toBe(true);
    });

    it('should return false if values are different', () => {
      const url1 = RepoURL.create(VALID_URL);
      const url2 = RepoURL.create('https://github.com/other/repo');
      expect(url1.equals(url2)).toBe(false);
    });

    it('should return false if compared with a different type', () => {
      const url = RepoURL.create(VALID_URL);
      const notARepoURL = { value: VALID_URL } as unknown as RepoURL;
      expect(url.equals(notARepoURL)).toBe(false);
    });
  });
});
