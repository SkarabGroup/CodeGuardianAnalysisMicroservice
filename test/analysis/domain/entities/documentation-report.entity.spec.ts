import {
  DocumentationReport,
  DocumentationReportProps,
} from '../../../../src/analysis/domain/entities/documentation-report.entity';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { APIViolation } from '../../../../src/analysis/domain/value-objects/api-violation.vo';
import { DocsDiscrepancy } from '../../../../src/analysis/domain/value-objects/docs-discrepancy.vo';
import { MissingFile } from '../../../../src/analysis/domain/value-objects/missing-file.vo';
import { DependencyAudit } from '../../../../src/analysis/domain/value-objects/dependency-audit.vo';
import { v7 as uuid } from 'uuid';

describe('DocumentationReport Entity', () => {
  const properties: DocumentationReportProps = {
    reportId: ReportId.create(uuid()),
    analysisId: AnalysisId.create(uuid()),
    apiViolations: [] as APIViolation[],
    docsDiscrepancies: [] as DocsDiscrepancy[],
    missingFiles: [] as MissingFile[],
    dependencyAudit: DependencyAudit.create(),
  };

  describe('Creation', () => {
    it('should be created with the provided properties', () => {
      const report = DocumentationReport.create(properties);

      expect(report.getReportId()).toBeInstanceOf(ReportId);
      expect(report.getAnalysisId()).toBeInstanceOf(AnalysisId);

      expect(report.getReportId().value).toBe(properties.reportId.value);
      expect(report.getAnalysisId().value).toBe(properties.analysisId.value);

      expect(report.getApiViolations()).toEqual(properties.apiViolations);
      expect(report.getDocsDiscrepancies()).toEqual(properties.docsDiscrepancies);
      expect(report.getMissingFiles()).toEqual(properties.missingFiles);
      expect(report.getDependencyAudit()).toBe(properties.dependencyAudit);
    });

    it('should default optional arrays to empty and audit to null if undefined', () => {
      const report = DocumentationReport.create({
        reportId: properties.reportId,
        analysisId: properties.analysisId,
      });

      expect(report.getApiViolations()).toEqual([]);
      expect(report.getDocsDiscrepancies()).toEqual([]);
      expect(report.getMissingFiles()).toEqual([]);
      expect(report.getDependencyAudit()).toBeNull();
    });
  });

  describe('Equality', () => {
    it('should return true if entities are equal (same reportId)', () => {
      const a = DocumentationReport.create(properties);
      const b = DocumentationReport.create(properties);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false if reportId is different', () => {
      const otherProps: DocumentationReportProps = {
        ...properties,
        reportId: ReportId.create(uuid()),
      };

      const a = DocumentationReport.create(properties);
      const b = DocumentationReport.create(otherProps);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when comparing with invalid object', () => {
      const report = DocumentationReport.create(properties);

      expect(report.equals(null)).toBe(false);
      expect(report.equals({})).toBe(false);
    });
  });
});
