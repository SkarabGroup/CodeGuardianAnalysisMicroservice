import { IssueLocation } from '../../../../src/analysis/domain/value-objects/issue-location.vo';

describe('IssueLocation', () => {
  it('should create a valid location', () => {
    const vo = IssueLocation.create(10, 15, 5);
    expect(vo.lineStart).toBe(10);
    expect(vo.lineEnd).toBe(15);
    expect(vo.column).toBe(5);
  });

  it('should allow lineStart and lineEnd to be equal', () => {
    const vo = IssueLocation.create(10, 10, 1);
    expect(vo.lineStart).toBe(vo.lineEnd);
  });

  it('should throw if lineStart is zero or negative', () => {
    expect(() => IssueLocation.create(0, 10, 1)).toThrow('Invalid location coordinates');
    expect(() => IssueLocation.create(-1, 10, 1)).toThrow('Invalid location coordinates');
  });

  it('should throw if lineEnd is less than lineStart', () => {
    expect(() => IssueLocation.create(20, 10, 1)).toThrow('Invalid location coordinates');
  });

  it('should throw if column is zero or negative', () => {
    expect(() => IssueLocation.create(10, 15, 0)).toThrow('Invalid location coordinates');
  });
});
