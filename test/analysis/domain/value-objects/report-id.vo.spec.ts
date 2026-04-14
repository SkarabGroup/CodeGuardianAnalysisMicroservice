import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { v7 as uuid } from 'uuid';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('ReportId Value Object', () => {
  it('should create a ReportId with a valid UUID', () => {
    expect(ReportId.create(uuid())).toBeInstanceOf(ReportId);
  });

  it('should consider the same instance as equal', () => {
    const reportId = ReportId.create(uuid());
    expect(reportId.equals(reportId)).toBe(true);
  });

  it('should consider two different generated ReportIds as not equal', () => {
    const reportId1 = ReportId.create(uuid());
    const reportId2 = ReportId.create(uuid());
    expect(reportId1.equals(reportId2)).toBe(false);
  });

  it('should return false when comparing with a different type or null', () => {
    const reportId = ReportId.create(uuid());
    const fakeObject = { _value: 'some-uuid' } as unknown as ReportId;

    expect(reportId.equals(fakeObject)).toBe(false);
    expect(reportId.equals(null as unknown as ReportId)).toBe(false);
  });

  it('should return the correct value', () => {
    const reportId = ReportId.create(uuid());
    expect(reportId.value).toMatch(UUID_V7_REGEX);
  });

  it('should launch error for not being a v7 uuid', () => {
    expect(() => ReportId.create('errore')).toThrow('Must be passed a valid UUID');
  });
});