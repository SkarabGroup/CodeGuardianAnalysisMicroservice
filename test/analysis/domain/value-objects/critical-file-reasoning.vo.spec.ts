import { CriticalFileReasoning } from '../../../../src/analysis/domain/value-objects/critical-file-reasoning.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { CoveragePercentage } from '../../../../src/analysis/domain/value-objects/coverage-percentage.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';

describe('CriticalFileReasoning', () => {
  const path = PathFinding.create('src/service.ts');
  const cov = CoveragePercentage.create(0.45);
  const reasoning = DescriptionFinding.create('Low coverage on core logic');

  it('should create a valid instance', () => {
    const vo = CriticalFileReasoning.create(path, cov, [40, 41, 42], 2, reasoning);
    expect(vo.missingLines).toEqual([40, 41, 42]);
    expect(vo.missingBranches).toBe(2);
    expect(vo.lineCoveragePct.value).toBe(0.45);
    expect(vo.file.value).toBe(path.value);
    expect(vo.aiReasoning.value).toBe(reasoning.value);
  });

  it('should throw if missingBranches is negative', () => {
    expect(() => CriticalFileReasoning.create(path, cov, [], -1, reasoning)).toThrow(
      'Missing branches cannot be negative',
    );
  });
});
