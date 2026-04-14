import { KeyIssueReasoning } from '../../../../src/analysis/domain/value-objects/key-issue-reasoning.vo';
import { IssueLocation } from '../../../../src/analysis/domain/value-objects/issue-location.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('KeyIssueReasoning', () => {
  const path = PathFinding.create('src/index.ts');
  const loc = IssueLocation.create(1, 2, 3);
  const sev = SeverityFinding.create('HIGH');
  const desc = DescriptionFinding.create('Original description');
  const reasoning = DescriptionFinding.create('AI reasoning');
  const fix = DescriptionFinding.create('Suggested fix');

  it('should create a valid instance', () => {
    const vo = KeyIssueReasoning.create(path, loc, 'rule-id', sev, desc, reasoning, fix);
    expect(vo.rule).toBe('rule-id');
    expect(vo.file.value).toBe('src/index.ts');
    expect(vo.severity.value).toBe('HIGH');
    expect(vo.location).toBe(loc);
    expect(vo.originalDescription).toBe(desc);
    expect(vo.originalDescription.value).toBe('Original description');

    expect(vo.aiReasoning).toBe(reasoning);
    expect(vo.aiReasoning.value).toBe('AI reasoning');

    expect(vo.suggestedResolution).toBe(fix);
    expect(vo.suggestedResolution.value).toBe('Suggested fix');
  });

  it('should throw if rule is empty', () => {
    expect(() => KeyIssueReasoning.create(path, loc, ' ', sev, desc, reasoning, fix)).toThrow(
      'Rule cannot be empty',
    );
  });
});
