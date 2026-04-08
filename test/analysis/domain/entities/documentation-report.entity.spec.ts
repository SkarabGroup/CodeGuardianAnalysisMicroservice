import {
  DocumentationReport,
  DocumentationReportProps,
} from '../../../../src/analysis/domain/entities/documentation-report.entity';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { DocumentationFinding } from '../../../../src/analysis/domain/value-objects/documentation-finding.vo';
import { v7 as uuid } from 'uuid';

describe('DocumentationReport Entity', () => {
  const documentationFindings: DocumentationFinding[] = [];

  const properties: DocumentationReportProps = {
    reportId: ReportId.create(uuid()),
    analysisId: AnalysisId.create(uuid()),
    documentationFindings,
  };

  describe('Creation', () => {
    it('should be created with the provided properties', () => {
      const report = DocumentationReport.create(properties);

      expect(report.getReportId()).toBeInstanceOf(ReportId);
      expect(report.getAnalysisId()).toBeInstanceOf(AnalysisId);

      expect(report.getReportId().value).toBe(properties.reportId.value);
      expect(report.getAnalysisId().value).toBe(properties.analysisId.value);

      expect(report.getDocumentationFindings()).toEqual(properties.documentationFindings);
    });

    it('should default documentationFindings to empty array if undefined', () => {
      const report = DocumentationReport.create({
        ...properties,
        documentationFindings: undefined as unknown as DocumentationFinding[],
      });

      expect(report.getDocumentationFindings()).toEqual([]);
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
  });
});
