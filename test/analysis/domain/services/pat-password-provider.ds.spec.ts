import { PATPasswordProvider } from '../../../../src/analysis/domain/services/pat-password-provider.ds';
import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';

describe('PATPasswordProvider', () => {
  let provider: PATPasswordProvider;

  beforeEach(() => {
    provider = new PATPasswordProvider();
  });

  it('should generate a PATPassword for a valid input', () => {
    const validPass = 'Valid123!';
    const result = provider.generate(validPass);

    expect(result).toBeInstanceOf(PATPassword);
    expect(result.value).toHaveLength(64);
  });

  describe('Validation Errors', () => {
    it('should throw if password is too short', () => {
      expect(() => provider.generate('V123!')).toThrow('at least 8 characters long');
    });

    it('should throw if no capital letter is present', () => {
      expect(() => provider.generate('valid123!')).toThrow('one capital letter');
    });

    it('should throw if no number is present', () => {
      expect(() => provider.generate('ValidPass!')).toThrow('at least one number');
    });

    it('should throw if no special character is present', () => {
      expect(() => provider.generate('ValidPass123')).toThrow('one special character');
    });
  });

  describe('Constructor and Integrity', () => {
    it('should be correctly instantiated', () => {
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(PATPasswordProvider);
    });
  });
});
