import { AnalisysId } from '../../../src/domain/value-objects/analisys-id.vo';
import { v4 as uuidv4 } from 'uuid';

describe('AnalisysId Value Object', () => {
  it('should create a AnalisysId with a valid UUID', () => {
    const validUuid = uuidv4();
    expect(AnalisysId.create(validUuid)).toBeInstanceOf(AnalisysId);
  });

  it('should throw an error for an invalid UUID or not a string', () => {
    const invalidUuid = 'invalid-uuid';
    expect(() => AnalisysId.create(invalidUuid)).toThrow(
      'Invalid UUID format for AnalisysId : ' + invalidUuid,
    );
    expect(() => AnalisysId.create(null)).toThrow('AnalisysId must be a string');
  });

  it('should consider two AnalisysIds with the same value as equal', () => {
    const uuid = uuidv4();
    const analisysId1 = AnalisysId.create(uuid);
    const analisysId2 = AnalisysId.create(uuid);
    expect(analisysId1.equals(analisysId2)).toBe(true);
  });

  it('should consider two AnalisysIds with different values as not equal', () => {
    const analisysId1 = AnalisysId.create(uuidv4());
    const analisysId2 = AnalisysId.create(uuidv4());
    expect(analisysId1.equals(analisysId2)).toBe(false);
  });

  it('should return false when comparing with a different type or null', () => {
    const uuid = uuidv4();
    const analisysId = AnalisysId.create(uuid);

    const fakeObject = { _value: uuid };

    expect(analisysId.equals(fakeObject)).toBe(false);

    expect(analisysId.equals(null)).toBe(false);
  });
});
