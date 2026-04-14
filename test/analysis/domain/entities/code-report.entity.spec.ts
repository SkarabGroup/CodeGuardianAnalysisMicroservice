import { CodeReport, CodeReportProps } from '../../../../src/analysis/domain/entities/code-report.entity';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { CodeVerdict } from '../../../../src/analysis/domain/enums/code-verdict.enum';
import { StaticAnalysisFinding } from '../../../../src/analysis/domain/value-objects/static-analysis-finding.vo';
import { StaticAnalysisIssue } from '../../../../src/analysis/domain/value-objects/static-analysis-issue.vo';
import { CoverageFinding } from '../../../../src/analysis/domain/value-objects/coverage-finding.vo';
import { FileCoverage } from '../../../../src/analysis/domain/value-objects/file-coverage.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { PositionFinding } from '../../../../src/analysis/domain/value-objects/position-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { CoveragePercentage } from '../../../../src/analysis/domain/value-objects/coverage-percentage.vo';
import { v7 as uuid } from 'uuid';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';

describe('CodeReport Entity', () => {
  const VALID_REPORT_ID = ReportId.create(uuid());
  const VALID_ANALYSIS_ID = AnalysisId.create(uuid());

  const properties: CodeReportProps = {
    reportId: VALID_REPORT_ID,
    analysisId: VALID_ANALYSIS_ID,
  };

  describe('Creation', () => {
    it('should be created with the provided properties', () => {
      const report = CodeReport.create(properties);

      expect(report.getReportId()).toBeInstanceOf(ReportId);
      expect(report.getAnalysisId()).toBeInstanceOf(AnalysisId);
      expect(report.getReportId().value).toBe(properties.reportId.value);
      expect(report.getAnalysisId().value).toBe(properties.analysisId.value);
    });

    it('should default optional fields when not provided', () => {
      const report = CodeReport.create(properties);

      expect(report.getCodeVerdict()).toBeNull();
      expect(report.getExecutiveSummary()).toBe('');
      expect(report.getStaticAnalysisFindings()).toEqual([]);
      expect(report.getCoverageFindings()).toEqual([]);
    });

    it('should create with all optional fields provided', () => {
      const VALID_SUMMARY = 'Codebase has critical security issues.';
      const VALID_FINDING = StaticAnalysisFinding.create(0, []);
      const VALID_COVERAGE = CoverageFinding.create(
        DescriptionFinding.create('Low coverage on critical paths'),
        [],
      );

      const report = CodeReport.create({
        ...properties,
        codeVerdict: CodeVerdict.CRITICAL,
        executiveSummary: VALID_SUMMARY,
        staticAnalysisFindings: [VALID_FINDING],
        coverageFindings: [VALID_COVERAGE],
      });

      expect(report.getCodeVerdict()).toBe(CodeVerdict.CRITICAL);
      expect(report.getExecutiveSummary()).toBe(VALID_SUMMARY);
      expect(report.getStaticAnalysisFindings()).toEqual([VALID_FINDING]);
      expect(report.getCoverageFindings()).toEqual([VALID_COVERAGE]);
    });

    it('should default codeVerdict to null when explicitly set to null', () => {
      const report = CodeReport.create({ ...properties, codeVerdict: null });
      expect(report.getCodeVerdict()).toBeNull();
    });

    it('should protect internal staticAnalysisFindings array (immutability)', () => {
      const VALID_FINDING = StaticAnalysisFinding.create(0, []);
      const report = CodeReport.create({ ...properties, staticAnalysisFindings: [VALID_FINDING] });

      const findings = report.getStaticAnalysisFindings();
      findings.push(StaticAnalysisFinding.create(0, []));

      expect(report.getStaticAnalysisFindings()).toHaveLength(1);
    });

    it('should protect internal coverageFindings array (immutability)', () => {
      const VALID_COVERAGE = CoverageFinding.create(
        DescriptionFinding.create('Low coverage'),
        [],
      );
      const report = CodeReport.create({ ...properties, coverageFindings: [VALID_COVERAGE] });

      const findings = report.getCoverageFindings();
      findings.push(VALID_COVERAGE);

      expect(report.getCoverageFindings()).toHaveLength(1);
    });
  });

  describe('Equality', () => {
    it('should return true if entities have the same reportId', () => {
      const a = CodeReport.create(properties);
      const b = CodeReport.create(properties);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false if reportId is different', () => {
      const a = CodeReport.create(properties);
      const b = CodeReport.create({ ...properties, reportId: ReportId.create(uuid()) });

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when comparing with invalid object', () => {
      const report = CodeReport.create(properties);

      expect(report.equals(null as any)).toBe(false);
      expect(report.equals({} as any)).toBe(false);
    });
  });

  describe('Realistic JSON report', () => { // I didn't have a real JSON report when i did this
    it('should be created from analysis JSON output', () => {
      const VALID_PATH_1 = PathFinding.create('src/auth/auth.service.ts');
      const VALID_PATH_2 = PathFinding.create('src/user/user.controller.ts');
      const VALID_POSITION = PositionFinding.create(10, 10, 4);
      const VALID_SEVERITY = SeverityFinding.create(SeverityLevel.HIGH);
      const VALID_ORIGINAL = DescriptionFinding.create('Unused variable detected');
      const VALID_REASONING = DescriptionFinding.create('Variable x declared but never read');
      const VALID_RESOLUTION = DescriptionFinding.create('Remove or use the variable');

      const issue1 = StaticAnalysisIssue.create(
        VALID_PATH_1, VALID_POSITION, 'no-unused-vars', VALID_SEVERITY,
        VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );
      const issue2 = StaticAnalysisIssue.create(
        VALID_PATH_2, VALID_POSITION, 'no-explicit-any', VALID_SEVERITY,
        VALID_ORIGINAL, VALID_REASONING, VALID_RESOLUTION,
      );

      const staticFinding = StaticAnalysisFinding.create(42, [issue1, issue2]);

      const FILE_PATH_1 = PathFinding.create('src/auth/auth.service.ts');
      const FILE_PATH_2 = PathFinding.create('src/user/user.controller.ts');
      const HEALTH = DescriptionFinding.create('Low coverage on auth and user modules');
      const FILE_REASONING = DescriptionFinding.create('Missing error handler and auth branch');

      const fileCoverage1 = FileCoverage.create(
        FILE_PATH_1, CoveragePercentage.create(0.45), [10, 20, 30], 3, FILE_REASONING,
      );
      const fileCoverage2 = FileCoverage.create(
        FILE_PATH_2, CoveragePercentage.create(0.6), [5, 15], 1, FILE_REASONING,
      );

      const coverageFinding = CoverageFinding.create(HEALTH, [fileCoverage1, fileCoverage2]);

      const report = CodeReport.create({
        reportId: ReportId.create(uuid()),
        analysisId: AnalysisId.create(uuid()),
        codeVerdict: CodeVerdict.POOR,
        executiveSummary: '42 issues found. Auth module at 45% line coverage with 3 missing branches.',
        staticAnalysisFindings: [staticFinding],
        coverageFindings: [coverageFinding],
      });

      expect(report).toBeInstanceOf(CodeReport);
      expect(report.getCodeVerdict()).toBe(CodeVerdict.POOR);
      expect(report.getStaticAnalysisFindings()).toHaveLength(1);
      expect(report.getStaticAnalysisFindings()[0].getTotalIssues()).toBe(42);
      expect(report.getStaticAnalysisFindings()[0].getIssues()).toHaveLength(2);
      expect(report.getCoverageFindings()).toHaveLength(1);
      expect(report.getCoverageFindings()[0].getCriticalFiles()).toHaveLength(2);
      expect(report.getCoverageFindings()[0].getCriticalFiles()[0].getMissingBranches()).toBe(3);
    });
  });
});