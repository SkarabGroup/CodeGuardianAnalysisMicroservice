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
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { SeverityFinding } from '../../../../src/analysis/domain/value-objects/severity-finding.vo';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { StatusMissing } from '../../../../src/analysis/domain/enums/status-missing.enum';
import { ConfigDependency } from '../../../../src/analysis/domain/value-objects/config-dependency.vo';
import { UndocumentedDependency } from '../../../../src/analysis/domain/value-objects/undocumented-dependency.vo';

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

  describe('Real Json report', () => {
    it('should be created from a real analysis JSON output', () => {
      const apiViolations = [
        APIViolation.create(
          PathFinding.create('apps/frontend/tsconfig.app.json'),
          'parser',
          SeverityFinding.create(SeverityLevel.HIGH),
          DescriptionFinding.create('Mapping key must be a string scalar rather than object'),
        ),
        APIViolation.create(
          PathFinding.create('apps/frontend/tsconfig.app.json'),
          'parser',
          SeverityFinding.create(SeverityLevel.HIGH),
          DescriptionFinding.create('Duplicate key: '),
        ),
        APIViolation.create(
          PathFinding.create('apps/frontend/tsconfig.app.json'),
          'parser',
          SeverityFinding.create(SeverityLevel.HIGH),
          DescriptionFinding.create('Missed comma between flow collection entries'),
        ),
        APIViolation.create(
          PathFinding.create('apps/frontend/tsconfig.node.json'),
          'parser',
          SeverityFinding.create(SeverityLevel.HIGH),
          DescriptionFinding.create('Mapping key must be a string scalar rather than object'),
        ),
        APIViolation.create(
          PathFinding.create('apps/frontend/tsconfig.node.json'),
          'parser',
          SeverityFinding.create(SeverityLevel.HIGH),
          DescriptionFinding.create('Duplicate key: '),
        ),
        APIViolation.create(
          PathFinding.create('apps/frontend/tsconfig.node.json'),
          'parser',
          SeverityFinding.create(SeverityLevel.HIGH),
          DescriptionFinding.create('Missed comma between flow collection entries'),
        ),
      ];

      const docsDiscrepancies = [
        DocsDiscrepancy.create(
          PathFinding.create('README.md'),
          'VERSION',
          SeverityFinding.create(SeverityLevel.LOW),
          DescriptionFinding.create('Versione del progetto non specificata nel README'),
          DescriptionFinding.create(
            "Il README non menziona la versione corrente dell'applicazione",
          ),
        ),
        DocsDiscrepancy.create(
          PathFinding.create('apps/api/README.md'),
          'DEPENDENCY',
          SeverityFinding.create(SeverityLevel.LOW),
          DescriptionFinding.create('Dipendenza non documentata'),
          DescriptionFinding.create(
            "Il package.json include 'wscat' che non è menzionato nel README",
          ),
        ),
        DocsDiscrepancy.create(
          PathFinding.create('apps/api/README.md'),
          'FILE_PATH',
          SeverityFinding.create(SeverityLevel.LOW),
          DescriptionFinding.create('Struttura file non corrispondente'),
          DescriptionFinding.create(
            "Il README menziona 'Dockerfile.agents' ma il file è 'Dockerfile.agents' nella struttura",
          ),
        ),
      ];

      const missingFiles = [
        MissingFile.create(
          PathFinding.create('apps/api/src/main.ts'),
          PathFinding.create('apps/api/README.md'),
          StatusMissing.NOT_FOUND,
          DescriptionFinding.create('Menzione nel README di main.ts ma il file non è presente'),
        ),
        MissingFile.create(
          PathFinding.create('apps/frontend/public/vite.svg'),
          PathFinding.create('apps/frontend/index.html'),
          StatusMissing.NOT_FOUND,
          DescriptionFinding.create("Riferimento a vite.svg nell'HTML ma il file non è presente"),
        ),
      ];

      const dependencyAudit = DependencyAudit.create({
        readmeDefined: [],
        configDefined: [
          ConfigDependency.create('wscat', null, PathFinding.create('apps/api/package.json')),
          ConfigDependency.create('ws', '^8.19.0', PathFinding.create('apps/api/package.json')),
          ConfigDependency.create('axios', '^1.13.5', PathFinding.create('apps/api/package.json')),
        ],
        missingInConfig: [],
        undocumentedInReadme: [
          UndocumentedDependency.create('wscat', PathFinding.create('apps/api/package.json')),
        ],
        versionMismatches: [],
      });

      const report = DocumentationReport.create({
        reportId: ReportId.create(uuid()),
        analysisId: AnalysisId.create(uuid()),
        apiViolations,
        docsDiscrepancies,
        missingFiles,
        dependencyAudit,
      });

      expect(report).toBeInstanceOf(DocumentationReport);

      expect(report.getApiViolations()).toHaveLength(6);
      expect(report.getDocsDiscrepancies()).toHaveLength(3);
      expect(report.getMissingFiles()).toHaveLength(2);

      const audit = report.getDependencyAudit();
      expect(audit).not.toBeNull();
      expect(audit.getConfigDefined()).toHaveLength(3);
      expect(audit.getUndocumentedInReadme()).toHaveLength(1);
      expect(audit.getUndocumentedInReadme()[0].getName()).toBe('wscat');
      expect(audit.getMissingInConfig()).toHaveLength(0);
      expect(audit.getVersionMismatches()).toHaveLength(0);
      expect(audit.getReadmeDefined()).toHaveLength(0);
    });
  });
});
