import { AnalysisId } from '../../../src/domain/value-objects/analysis-id.vo';
import { v4 as uuidv4 } from 'uuid';

describe('AnalysisId Value Object', () => {
  it('should create a AnalysisId with a valid UUID', () => {
    const validUuid = uuidv4();
    expect(AnalysisId.create(validUuid)).toBeInstanceOf(AnalysisId);
  });

  it('should throw an error for an invalid UUID or not a string', () => {
    const invalidUuid = 'invalid-uuid';
    expect(() => AnalysisId.create(invalidUuid)).toThrow(
      'Invalid UUID format for AnalysisId : ' + invalidUuid,
    );
    expect(() => AnalysisId.create(null)).toThrow('AnalysisId must be a string');
  });

  it('should consider two AnalysisIds with the same value as equal', () => {
    const uuid = uuidv4();
    const analysisId1 = AnalysisId.create(uuid);
    const analysisId2 = AnalysisId.create(uuid);
    expect(analysisId1.equals(analysisId2)).toBe(true);
  });

  it('should consider two AnalysisIds with different values as not equal', () => {
    const analysisId1 = AnalysisId.create(uuidv4());
    const analysisId2 = AnalysisId.create(uuidv4());
    expect(analysisId1.equals(analysisId2)).toBe(false);
  });

  it('should return false when comparing with a different type or null', () => {
    const uuid = uuidv4();
    const analysisId = AnalysisId.create(uuid);

    const fakeObject = { _value: uuid };

    expect(analysisId.equals(fakeObject)).toBe(false);

    expect(analysisId.equals(null)).toBe(false);
  });

  it('should return the correct value', () => {
    const uuid = uuidv4();
    const analysisId = AnalysisId.create(uuid);
    expect(analysisId.getValue()).toBe(uuid);
  });

  it('should return the wrong value', () => {
    const uuid = uuidv4();
    const uuid2 = uuidv4();
    const analysisId = AnalysisId.create(uuid);
    expect(analysisId.getValue()).not.toBe(uuid2);
  });
});
