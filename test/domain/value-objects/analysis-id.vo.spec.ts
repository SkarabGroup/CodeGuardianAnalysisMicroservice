import { AnalysisId } from '../../../src/domain/value-objects/analysis-id.vo';

describe('AnalysisId Value Object', () => {
  it('should create a AnalysisId with a valid UUID', () => {
    expect(AnalysisId.create()).toBeInstanceOf(AnalysisId);
  });

  it('should consider the same instance as equal', () => {
    const analysisId = AnalysisId.create();
    expect(analysisId.equals(analysisId)).toBe(true);
  });

  it('should consider two different generated AnalysisIds as not equal', () => {
    const analysisId1 = AnalysisId.create();
    const analysisId2 = AnalysisId.create();
    expect(analysisId1.equals(analysisId2)).toBe(false);
  });

  it('should return false when comparing with a different type or null', () => {
    const analysisId = AnalysisId.create();
    const fakeObject = { _value: 'some-uuid' } as unknown as AnalysisId;

    expect(analysisId.equals(fakeObject)).toBe(false);
    expect(analysisId.equals(null as unknown as AnalysisId)).toBe(false);
  });

  it('should return the correct value', () => {
    const analysisId = AnalysisId.create();
    expect(analysisId.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
