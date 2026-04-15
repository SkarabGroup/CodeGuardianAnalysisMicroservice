import { Test, TestingModule } from '@nestjs/testing';
import { ReportEntitiesProvider } from '../../../../src/analysis/domain/services/report-entities-provider.ds';
import { DocsAgentResponse } from '../../../../src/analysis/application/DTOs/models/responses/docs-agent-response-model.model';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';
import { StatusMissing } from '../../../../src/analysis/domain/enums/status-missing.enum';

describe('ReportEntitiesProvider', () => {
  let provider: ReportEntitiesProvider;

  // FIX: Creazione corretta dei Value Objects reali invece di mock parziali
  const mockReportId = ReportId.create('01890f47-8b6e-7d63-9f0b-9b5f8e1c2a1a');
  const mockAnalysisId = AnalysisId.create('01890f47-8b6e-7d63-9f0b-9b5f8e1c2a1b');

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
      // FIX: Utilizzo di getDependencyAudit() e accesso corretto ai suoi array
      expect(result.getDependencyAudit()?.getVersionMismatches()).toEqual([]);
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
