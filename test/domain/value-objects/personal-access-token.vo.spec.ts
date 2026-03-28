import { PersonalAccessToken } from '../../../src/domain/value-objects/personal-access-token.vo';

const VALID_GHP = 'ghp_' + 'A'.repeat(36);
const VALID_PAT = 'github_pat_' + 'A'.repeat(82);
const VALID_PAT_2 = 'github_pat_' + 'B'.repeat(82);
describe('PersonalAccessToken', () => {
  it('should create a valid token with ghp_ prefix', () => {
    const token = PersonalAccessToken.create(VALID_GHP);
    expect(token).toBeDefined();
  });

  it('should create a valid token with github_pat_ prefix', () => {
    const token = PersonalAccessToken.create(VALID_PAT);
    expect(token).toBeDefined();
  });

  it('should compare two equal tokens as equal', () => {
    const t1 = PersonalAccessToken.create(VALID_GHP);
    const t2 = PersonalAccessToken.create(VALID_GHP);
    expect(t1.equals(t2)).toBe(true);
  });

  it('should compare two different tokens as not equal', () => {
    const t1 = PersonalAccessToken.create(VALID_PAT);
    const t2 = PersonalAccessToken.create(VALID_PAT_2);
    expect(t1.equals(t2)).toBe(false);
  });

  it('should throw an error for an empty string', () => {
    expect(() => PersonalAccessToken.create('')).toThrow('PAT cannot be null, empty, or blank');
  });

  it('should throw an error for a blank string', () => {
    expect(() => PersonalAccessToken.create('   ')).toThrow('PAT cannot be null, empty, or blank');
  });

  it('should throw an error for an invalid format', () => {
    expect(() => PersonalAccessToken.create('abc123')).toThrow('PAT has an invalid format');
  });

  it('should compare with a non-PersonalAccessToken object as not equal', () => {
    const token = PersonalAccessToken.create(VALID_GHP);
    const fakeObject = { _value: 'ghp_123' };
    expect(token.equals(fakeObject)).toBe(false);
  });

  it('should throw an error when the pat is invalid', () => {
    expect(() => PersonalAccessToken.create('github_pat_aaaaaaaaa')).toThrow(
      'PAT has an invalid format',
    );
    expect(() => PersonalAccessToken.create('ghp_aaaaaaaaaaaaaaaaaaaaa')).toThrow(
      'PAT has an invalid format',
    );
    expect(() => PersonalAccessToken.create('ghp_#aaaaaaaaaaaaaaaaaaa')).toThrow(
      'PAT has an invalid format',
    );
  });

  it('should return the correct value', () => {
    const token = PersonalAccessToken.create(VALID_GHP);
    expect(token.value).toBe(VALID_GHP);
  });
});
