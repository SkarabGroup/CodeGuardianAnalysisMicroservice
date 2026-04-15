import { Test, TestingModule } from '@nestjs/testing';
import { ReportEntitiesProvider } from '../../../../src/analysis/domain/services/report-entities-provider.ds';
import { DocsAgentResponse } from '../../../../src/analysis/application/DTOs/models/responses/docs-agent-response-model.model';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';
import { StatusMissing } from '../../../../src/analysis/domain/enums/status-missing.enum';
import { v7 as uuidv7 } from 'uuid';

describe('ReportEntitiesProvider', () => {
  let provider: ReportEntitiesProvider;

  // FIX: Creazione corretta dei Value Objects reali invece di mock parziali
  const mockReportId = ReportId.create(uuidv7());
  const mockAnalysisId = AnalysisId.create(uuidv7());

  const mockResponse: DocsAgentResponse = {
    analysis_report: {
      metadata: {
        repository: 'test-repo',
        status: 'completed',
      },
      API_standard_violations: [
        {
          file: 'src/api.ts',
          rule: 'REST-001',
          severity: 'high',
          message: 'Missing endpoint',
        },
      ],
      docs_discrepancies: [
        {
          documentation_source: 'README.md',
          category: 'STALE',
          severity: 'warning',
          docs_claim: 'Method X exists',
          actual_finding: 'Method X was removed',
        },
      ],
      missing_files: [
        {
          referenced_path: './config.json',
          referenced_in: 'main.ts',
          status: 'FILE_NOT_FOUND',
          context: 'Import at line 10',
        },
      ],
      dependency_audit: {
        readme_defined: [{ name: 'lodash', version_pinned: '4.17.21', source_file: 'README.md' }],
        config_defined: [
          { name: 'lodash', version_pinned: '4.17.21', source_file: 'package.json' },
        ],
        missing_in_config: [{ name: 'jest', severity: 'info', documented_in: 'README.md' }],
        undocumented_in_readme: [{ name: 'dotenv', found_in: 'package.json' }],
        version_mismatches: [
          {
            name: 'typescript',
            version_pinned: '5.0.0',
            config_version: '4.9.0',
            source_file: 'package.json',
          },
        ],
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportEntitiesProvider],
    }).compile();

    provider = module.get<ReportEntitiesProvider>(ReportEntitiesProvider);
  });

  describe('mapDocsAgentResponseToDocumentationReport', () => {
    it('should correctly map the DTO to a DocumentationReport entity', () => {
      const result = provider.fromDocsAgentResponse(mockResponse, mockReportId, mockAnalysisId);

      // FIX: Accesso tramite getter pubblici definiti nelle tue entità
      expect(result.getReportId()).toEqual(mockReportId);
      expect(result.getAnalysisId()).toEqual(mockAnalysisId);

      // Verifica Violazioni API
      expect(result.getApiViolations()).toHaveLength(1);
      expect(result.getApiViolations()[0].getRule()).toBe('REST-001');
      // FIX: Accesso corretto alla proprietà del Value Object SeverityFinding
      expect(result.getApiViolations()[0].getSeverityFinding().value).toBe(SeverityLevel.HIGH);

      // Verifica Discrepanze
      expect(result.getDocsDiscrepancies()).toHaveLength(1);
      expect(result.getDocsDiscrepancies()[0].getDiscrepancyCategory()).toBe('STALE');

      // Verifica File Mancanti e normalizzazione stato
      expect(result.getMissingFiles()).toHaveLength(1);
      expect(result.getMissingFiles()[0].getStatusMissing()).toBe(StatusMissing.NOT_FOUND);
    });

    it('should handle empty or missing fields in the DTO gracefully', () => {
      const emptyResponse: DocsAgentResponse = {
        analysis_report: {
          metadata: {
            repository: 'test-repo',
            status: 'completed',
          },
          API_standard_violations: [],
          docs_discrepancies: [],
          missing_files: [],
          dependency_audit: {
            readme_defined: [],
            config_defined: [],
            missing_in_config: [],
            undocumented_in_readme: [],
            version_mismatches: [],
          },
        },
      };

      const result = provider.fromDocsAgentResponse(emptyResponse, mockReportId, mockAnalysisId);

      expect(result.getApiViolations()).toEqual([]);
      // FIX: getDependencyAudit() restituisce un oggetto, non un array
      expect(result.getDependencyAudit()).not.toBeNull();
      expect(result.getDependencyAudit()!.getReadmeDefined()).toEqual([]);
      expect(result.getDependencyAudit()!.getVersionMismatches()).toEqual([]);
    });

    it('should correctly map version mismatches and fallback to pinned version if config_version is missing', () => {
      const mismatchResponse: DocsAgentResponse = {
        ...mockResponse,
        analysis_report: {
          ...mockResponse.analysis_report,
          dependency_audit: {
            ...mockResponse.analysis_report.dependency_audit,
            version_mismatches: [
              {
                name: 'nest',
                version_pinned: '10.0.0',
                source_file: 'README.md',
              },
            ],
          },
        },
      };

      const result = provider.fromDocsAgentResponse(mismatchResponse, mockReportId, mockAnalysisId);
      const dependencyAudit = result.getDependencyAudit();

      expect(dependencyAudit).not.toBeNull();
      const mismatch = dependencyAudit!.getVersionMismatches()[0];

      expect(mismatch.getName()).toBe('nest');
      expect(mismatch.getConfigVersion()).toBe('10.0.0');
    });

    it('should normalize docs fallback values and dependency audit aliases', () => {
      const fallbackResponse: DocsAgentResponse = {
        analysis_report: {
          metadata: {
            repository: 'test-repo',
            status: 'completed',
          },
          API_standard_violations: [
            {
              file: '',
              rule: '',
              severity: 'fatal',
              message: '',
            },
          ],
          docs_discrepancies: [
            {
              documentation_source: '',
              category: '',
              severity: 'error',
              docs_claim: '',
              actual_finding: '',
            },
          ],
          missing_files: [
            {
              referenced_path: '',
              referenced_in: '',
              status: 'wrong path',
              context: '',
            },
          ],
          dependency_audit: {
            readme_defined: [{ name: 'left-pad', version_pinned: null, source_file: '' }],
            config_defined: [{ name: 'left-pad', version_pinned: null, source_file: '' }],
            missing_in_config: [
              { name: 'jest', severity: 'hint', documented_in: 'docs/README.md' },
              { name: 'typescript', severity: 'mystery', source_file: '' },
            ],
            undocumented_in_readme: [{ name: 'dotenv', found_in: '' }],
            version_mismatches: [
              {
                name: 'lodash',
                version_pinned: null,
                source_file: 'README.md',
              },
              {
                name: 'typescript',
                version_pinned: '5.0.0',
                source_file: '',
              },
            ],
          },
        },
      };

      const result = provider.fromDocsAgentResponse(fallbackResponse, mockReportId, mockAnalysisId);

      const apiViolation = result.getApiViolations()[0];
      expect(apiViolation.getPathFinding().value).toBe('UNKNOWN');
      expect(apiViolation.getRule()).toBe('UNSPECIFIED_RULE');
      expect(apiViolation.getSeverityFinding().value).toBe(SeverityLevel.CRITICAL);
      expect(apiViolation.getDescriptionFinding().value).toBe('No description provided');

      const discrepancy = result.getDocsDiscrepancies()[0];
      expect(discrepancy.getPathFinding().value).toBe('UNKNOWN');
      expect(discrepancy.getDiscrepancyCategory()).toBe('OTHER');
      expect(discrepancy.getSeverityFinding().value).toBe(SeverityLevel.HIGH);
      expect(discrepancy.getDocsClaim().value).toBe('No claim documented');
      expect(discrepancy.getActualFinding().value).toBe('No finding reported');

      const missingFile = result.getMissingFiles()[0];
      expect(missingFile.getReferencedPath().value).toBe('UNKNOWN');
      expect(missingFile.getReferencedIn().value).toBe('UNKNOWN');
      expect(missingFile.getStatusMissing()).toBe(StatusMissing.WRONG_PATH);
      expect(missingFile.getDescriptionFinding().value).toBe('No context provided');

      const dependencyAudit = result.getDependencyAudit();
      expect(dependencyAudit).not.toBeNull();

      const readmeDependency = dependencyAudit!.getReadmeDefined()[0];
      expect(readmeDependency.getVersionClaimed()).toBeNull();

      const configDependency = dependencyAudit!.getConfigDefined()[0];
      expect(configDependency.getPathFinding().value).toBe('package.json');

      const missingInConfig = dependencyAudit!.getMissingInConfig();
      expect(missingInConfig[0].getPathFinding().value).toBe('docs/README.md');
      expect(missingInConfig[0].getSeverityFinding().value).toBe(SeverityLevel.LOW);
      expect(missingInConfig[1].getPathFinding().value).toBe('UNKNOWN');
      expect(missingInConfig[1].getSeverityFinding().value).toBe(SeverityLevel.MEDIUM);

      const undocumented = dependencyAudit!.getUndocumentedInReadme()[0];
      expect(undocumented.getPathFinding().value).toBe('UNKNOWN');

      const versionMismatches = dependencyAudit!.getVersionMismatches();
      expect(versionMismatches).toHaveLength(1);
      expect(versionMismatches[0].getConfigVersion()).toBe('5.0.0');
      expect(versionMismatches[0].getPathFinding().value).toBe('UNKNOWN');
    });
  });

  describe('Normalization functions logic', () => {
    it('should normalize severity levels correctly from raw strings', () => {
      const result = provider.fromDocsAgentResponse(mockResponse, mockReportId, mockAnalysisId);
      // 'high' -> SeverityLevel.HIGH
      expect(result.getApiViolations()[0].getSeverityFinding().value).toBe(SeverityLevel.HIGH);
    });

    it('should normalize status missing correctly from raw strings', () => {
      const result = provider.fromDocsAgentResponse(mockResponse, mockReportId, mockAnalysisId);
      // 'FILE_NOT_FOUND' -> StatusMissing.NOT_FOUND
      expect(result.getMissingFiles()[0].getStatusMissing()).toBe(StatusMissing.NOT_FOUND);
    });
  });
});
