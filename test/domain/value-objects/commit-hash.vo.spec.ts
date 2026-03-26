import { CommitHash } from '../../../src/domain/value-objects/commit-hash.vo';

describe('CommitHash', () => {
  it('should create a valid CommitHash', () => {
    const validHash = 'a'.repeat(40);
    const commitHash = CommitHash.create(validHash);
    expect(commitHash).toBeInstanceOf(CommitHash);
  });

  it('should throw an error for invalid commit hash format', () => {
    expect(() => CommitHash.create('invalid-hash')).toThrow('Invalid commit hash format');
  });

  it('should throw an error for non-string input', () => {
    expect(() => CommitHash.create(123)).toThrow('Commit hash must be a string');
  });

  it('should throw an error for empty string input', () => {
    expect(() => CommitHash.create('')).toThrow('Commit hash cannot be empty');
    expect(() => CommitHash.create('   ')).toThrow('Commit hash cannot be empty');
  });

  it('should compare two CommitHash instances for equality', () => {
    const hash1 = CommitHash.create('a'.repeat(40));
    const hash2 = CommitHash.create('a'.repeat(40));
    const hash3 = CommitHash.create('b'.repeat(40));

    expect(hash1.equals(hash2)).toBe(true);
    expect(hash1.equals(hash3)).toBe(false);
  });

  it('should throw an error when comparing with a non-CommitHash instance', () => {
    const hash = CommitHash.create('a'.repeat(40));
    expect(() => hash.equals(null)).toThrow('Invalid argument');
    expect(() => hash.equals({})).toThrow('Invalid argument');
  });
});
