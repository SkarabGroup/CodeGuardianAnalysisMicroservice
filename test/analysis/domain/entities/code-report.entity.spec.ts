import {
  CodeReport,
  CodeReportProps,
} from '../../../../src/analysis/domain/entities/code-report.entity';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { CoverageFinding } from '../../../../src/analysis/domain/value-objects/coverage-finding.vo';
import { StaticAnalysisFinding } from '../../../../src/analysis/domain/value-objects/static-analysis-finding.vo';
import { v7 as uuid } from 'uuid';

describe('CodeReport Entity', () => {
  const properties: CodeReportProps = {
    reportId: ReportId.create(uuid()),
    analysisId: AnalysisId.create(uuid()),
    coverageFinding: [] as CoverageFinding[],
    staticAnalysisErrors: [] as StaticAnalysisFinding[],
  };

  describe('Creation', () => {
    it('should be created with the provided properties', () => {
      const report = CodeReport.create(properties);

      expect(report.getReportId()).toBeInstanceOf(ReportId);
      expect(report.getAnalysisId()).toBeInstanceOf(AnalysisId);

      expect(report.getReportId().value).toBe(properties.reportId.value);
      expect(report.getAnalysisId().value).toBe(properties.analysisId.value);

      expect(report.getCoverageFinding()).toEqual(properties.coverageFinding);
      expect(report.getStaticAnalysisErrors()).toEqual(properties.staticAnalysisErrors);
    });

    it('should default arrays to empty if undefined', () => {
      const report = CodeReport.create({
        ...properties,
        coverageFinding: undefined as unknown as CoverageFinding[],
        staticAnalysisErrors: undefined as unknown as StaticAnalysisFinding[],
      });

      expect(report.getCoverageFinding()).toEqual([]);
      expect(report.getStaticAnalysisErrors()).toEqual([]);
    });
  });

  describe('Equality', () => {
    it('should return true if entities are equal (same reportId)', () => {
      const a = CodeReport.create(properties);
      const b = CodeReport.create(properties);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false if reportId is different', () => {
      const otherProps: CodeReportProps = {
        ...properties,
        reportId: ReportId.create(uuid()),
      };

      const a = CodeReport.create(properties);
      const b = CodeReport.create(otherProps);

      expect(a.equals(b)).toBe(false);
    });
  });
});
