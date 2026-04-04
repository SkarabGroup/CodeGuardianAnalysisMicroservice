import { PATPassword } from '../../../../src/analysis/domain/value-objects/pat-password.vo';

describe('PatPassword (Value Object)', () => {
  const VALID_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const INVALID_SHA256 = 'too-short-hash';
  const INVALID_CHARS = 'g3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85z'; // 'g' e 'z' non esadecimali

  describe('Success cases', () => {
    it('should create a valid PatPassword instance', () => {
      const pat = PATPassword.create(VALID_SHA256);

      expect(pat).toBeDefined();
      expect(pat.value).toBe(VALID_SHA256);
    });

    it('should accept uppercase hex characters (case-insensitive)', () => {
      const uppercaseHash = VALID_SHA256.toUpperCase();
      const pat = PATPassword.create(uppercaseHash);

      expect(pat.value).toBe(uppercaseHash);
    });
  });

  describe('Failure cases', () => {
    it('should throw an error if the string length is not 64 characters', () => {
      expect(() => PATPassword.create(INVALID_SHA256)).toThrow(
        'Must be a SHA-256 formatted string',
      );
    });

    it('should throw an error if the string contains non-hexadecimal characters', () => {
      expect(() => PATPassword.create(INVALID_CHARS)).toThrow('Must be a SHA-256 formatted string');
    });

    it('should throw an error if the string is empty', () => {
      expect(() => PATPassword.create('')).toThrow('Must be a SHA-256 formatted string');
    });
  });
});
