import { SecurityReport } from '../../../../src/analysis/domain/entities/security-report.entity';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { DependencyFinding } from '../../../../src/analysis/domain/value-objects/dependency-finding.vo';
import { OWASPFinding } from '../../../../src/analysis/domain/value-objects/owasp-finding.vo';
import { SecretFinding } from '../../../../src/analysis/domain/value-objects/secret-finding.vo';
import { ToolError } from '../../../../src/analysis/domain/value-objects/tool-error.vo';

describe('SecurityReport (Entity)', () => {
  const ridStr = '018d879a-ff0f-769b-b558-e930b71aaa5b';
  const rid = ReportId.create(ridStr);
  const aid = AnalysisId.create('018d879a-ff0f-769b-b558-e930b71aaa5b');

  // Usiamo dei mock per i value objects per isolare il test dell'entity
  const mockDependencyFinding = {} as DependencyFinding;
  const mockOwaspFinding = {} as OWASPFinding;
  const mockSecretFinding = {} as SecretFinding;
  const mockToolError = {} as ToolError;

  it('should create a new report instance with provided properties', () => {
    const report = SecurityReport.create({
      reportId: rid,
      analysisId: aid,
      dependencyFindings: [mockDependencyFinding],
      owaspFindings: [mockOwaspFinding],
      secretFindings: [mockSecretFinding],
      toolErrors: [mockToolError],
    });

    expect(report.getReportId()).toBe(rid);
    expect(report.getAnalysisId()).toBe(aid);

    // Usiamo toEqual perché i getter restituiscono una copia dell'array ([...this.array])
    expect(report.getDependencyFindings()).toEqual([mockDependencyFinding]);
    expect(report.getOwaspFindings()).toEqual([mockOwaspFinding]);
    expect(report.getSecretFindings()).toEqual([mockSecretFinding]);
    expect(report.getToolErrors()).toEqual([mockToolError]);
  });

  it('should handle undefined arrays and default to empty arrays', () => {
    const report = SecurityReport.create({
      reportId: rid,
      analysisId: aid,
      dependencyFindings: undefined as unknown as DependencyFinding[],
      owaspFindings: undefined as unknown as OWASPFinding[],
      secretFindings: undefined as unknown as SecretFinding[],
      toolErrors: undefined as unknown as ToolError[],
    });

    expect(report.getDependencyFindings()).toEqual([]);
    expect(report.getOwaspFindings()).toEqual([]);
    expect(report.getSecretFindings()).toEqual([]);
    expect(report.getToolErrors()).toEqual([]);
  });

  describe('equals', () => {
    const baseProps = {
      reportId: rid,
      analysisId: aid,
      dependencyFindings: [],
      owaspFindings: [],
      secretFindings: [],
      toolErrors: [],
    };

    it('should return true if report IDs are equal', () => {
      const report1 = SecurityReport.create(baseProps);

      const sameRid = ReportId.create(ridStr);
      const report2 = SecurityReport.create({
        ...baseProps,
        reportId: sameRid,
      });

      expect(report1.equals(report2)).toBe(true);
    });

    it('should return false if report IDs are different', () => {
      const report1 = SecurityReport.create(baseProps);

      const differentRid = ReportId.create('018d879a-ff0f-769b-b558-e930b71aaa5c');
      const report2 = SecurityReport.create({
        ...baseProps,
        reportId: differentRid,
      });

      expect(report1.equals(report2)).toBe(false);
    });

    it('should return false if compared with a different type or null', () => {
      const report = SecurityReport.create(baseProps);

      expect(report.equals(null)).toBe(false);
      expect(report.equals({})).toBe(false);
    });
  });
});
