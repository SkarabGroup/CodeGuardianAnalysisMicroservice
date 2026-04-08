import {
  SecurityReport,
  SecurityReportProps,
} from '../../../../src/analysis/domain/entities/security-report.entity';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { DependencyFinding } from '../../../../src/analysis/domain/value-objects/dependency-finding.vo';
import { OWASPFinding } from '../../../../src/analysis/domain/value-objects/owasp-finding.vo';
import { SecretFinding } from '../../../../src/analysis/domain/value-objects/secret-finding.vo';
import { v7 as uuid } from 'uuid';

describe('SecurityReport Entity', () => {
  const properties: SecurityReportProps = {
    reportId: ReportId.create(uuid()),
    analysisId: AnalysisId.create(uuid()),
    dependencyFindings: [] as DependencyFinding[],
    owaspFindings: [] as OWASPFinding[],
    secretFindings: [] as SecretFinding[],
  };

  describe('Creation', () => {
    it('should be created with the provided properties', () => {
      const report = SecurityReport.create(properties);

      expect(report.getReportId()).toBeInstanceOf(ReportId);
      expect(report.getAnalysisId()).toBeInstanceOf(AnalysisId);

      expect(report.getReportId().value).toBe(properties.reportId.value);
      expect(report.getAnalysisId().value).toBe(properties.analysisId.value);

      expect(report.getDependencyFindings()).toEqual(properties.dependencyFindings);
      expect(report.getOwaspFindings()).toEqual(properties.owaspFindings);
      expect(report.getSecretFindings()).toEqual(properties.secretFindings);
    });

    it('should handle undefined arrays and default to empty arrays', () => {
      const report = SecurityReport.create({
        reportid: ReportId.create(uuid()),
        analysisid: AnalysisId.create(uuid()),
        // segnato come opzionale con `undefined` invece di usare `any`
        dependencyFindings: undefined as unknown as DependencyFinding[],
        owaspFindings: undefined as unknown as OWASPFinding[],
        secretFindings: undefined as unknown as SecretFinding[],
      });

      expect(report.getDependencyFindings()).toEqual([]);
      expect(report.getOwaspFindings()).toEqual([]);
      expect(report.getSecretFindings()).toEqual([]);
    });
  });

  describe('Equality', () => {
    it('should return true if entities are equal (same reportId)', () => {
      const a = SecurityReport.create(properties);
      const b = SecurityReport.create(properties);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false if reportId is different', () => {
      const otherProps: SecurityReportProps = {
        ...properties,
        reportId: ReportId.create(uuid()),
      };

      const a = SecurityReport.create(properties);
      const b = SecurityReport.create(otherProps);

      expect(a.equals(b)).toBe(false);
    });
  });
});
