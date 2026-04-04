import { UserId } from '../../../../src/analysis/domain/value-objects/user-id.vo';
import { v4 as uuidv4 } from 'uuid';

describe('UserId Value Object', () => {
  it('should create a UserId with a valid UUID', () => {
    const validUuid = uuidv4();
    const userId = UserId.create(validUuid);
    expect(userId.value).toBe(validUuid);
  });

  it('should throw an error for an invalid UUID', () => {
    const invalidUuid = 'invalid-uuid';
    expect(() => UserId.create(invalidUuid)).toThrow(
      'Invalid UUID format for UserId : ' + invalidUuid,
    );
  });

  it('should consider two UserIds with the same value as equal', () => {
    const uuid = uuidv4();
    const userId1 = UserId.create(uuid);
    const userId2 = UserId.create(uuid);
    expect(userId1.equals(userId2)).toBe(true);
  });

  it('should consider two UserIds with different values as not equal', () => {
    const userId1 = UserId.create(uuidv4());
    const userId2 = UserId.create(uuidv4());
    expect(userId1.equals(userId2)).toBe(false);
  });

  it('should return the correct value', () => {
    const uuid = uuidv4();
    const userId = UserId.create(uuid);
    expect(userId.value).toBe(uuid);
  });

  it('should return the wrong value', () => {
    const uuid = uuidv4();
    const uuid2 = uuidv4();
    const userId = UserId.create(uuid);
    expect(userId.value).not.toBe(uuid2);
  });

  it('should return false when comparing with a different type', () => {
    const uuid = uuidv4();
    const userId = UserId.create(uuid);

    const fakeObject = { _value: uuid };

    expect(userId.equals(fakeObject)).toBe(false);

    expect(userId.equals(null)).toBe(false);
  });
});
