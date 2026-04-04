import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { v7 as uuid } from 'uuid';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('AnalysisId Value Object', () => {
  it('should create a AnalysisId with a valid UUID', () => {
    expect(AnalysisId.create(uuid())).toBeInstanceOf(AnalysisId);
  });

  it('should consider the same instance as equal', () => {
    const analysisId = AnalysisId.create(uuid());
    expect(analysisId.equals(analysisId)).toBe(true);
  });

  it('should consider two different generated AnalysisIds as not equal', () => {
    const analysisId1 = AnalysisId.create(uuid());
    const analysisId2 = AnalysisId.create(uuid());
    expect(analysisId1.equals(analysisId2)).toBe(false);
  });

  it('should return false when comparing with a different type or null', () => {
    const analysisId = AnalysisId.create(uuid());
    const fakeObject = { _value: 'some-uuid' } as unknown as AnalysisId;

    expect(analysisId.equals(fakeObject)).toBe(false);
    expect(analysisId.equals(null as unknown as AnalysisId)).toBe(false);
  });

  it('should return the correct value', () => {
    const analysisId = AnalysisId.create(uuid());
    expect(analysisId.value).toMatch(UUID_V7_REGEX);
  });

  it('should launch error for not being a v7 uuid', () => {
    expect(() => AnalysisId.create('errore')).toThrow('Must be passed a valid UUID');
  });
});
