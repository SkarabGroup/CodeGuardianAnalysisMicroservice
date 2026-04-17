import { Test, TestingModule } from '@nestjs/testing';
import { ReportEntitiesProvider } from '../../../../src/analysis/domain/services/report-entities-provider.ds';
import { DocsAgentResponse } from '../../../../src/analysis/application/DTOs/models/responses/docs-agent-response-model.model';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';
import { SeverityLevel } from '../../../../src/analysis/domain/enums/severity-level.enum';
import { StatusMissing } from '../../../../src/analysis/domain/enums/status-missing.enum';
import { v7 as uuidv7 } from 'uuid';
import { VerdictStatus } from '../../../../src/analysis/domain/enums/verdict-status.enum';
import {
  CodeAgentResponse,
  CodeAgentResponsePayload,
} from '../../../../src/analysis/application/DTOs/models/responses/code-agent-response-model.model';
import { SecAgentResponse } from '../../../../src/analysis/application/DTOs/models/responses/security-agent-response-model.model';

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

  describe('fromCodeAgentResponse', () => {
    const mockCodeResponsePayload: CodeAgentResponsePayload = {
      metadata: {
        language: 'javascript/typescript',
        status: 'success',
      },
      ai_interpretation: {
        verdict: 'Poor',
        executive_summary: 'Codebase has 265 static analysis issues...',
        static_analysis_evaluation: {
          total_issues_analyzed: 265,
          key_issues_reasoning: [
            {
              file: 'src/analysis/application/services/start-analysis.as.ts',
              location: {
                line_start: 54,
                line_end: 54,
                column: 16,
              },
              rule: 'lint/suspicious/useIterableCallbackReturn',
              severity: 'high',
              original_description:
                'This callback passed to forEach() iterable method should not return a value.',
              ai_reasoning: 'Returning values inside a forEach...',
              suggested_resolution: 'Replace forEach with map...',
            },
          ],
        },
        coverage_evaluation: {
          overall_health: 'Poor',
          critical_files_reasoning: [
            {
              file: 'src/analysis/presentation/controllers/pat-controller.controller.ts',
              line_coverage_pct: 100,
              missing_lines: [],
              missing_branches: 6,
              ai_reasoning: 'Despite full line coverage, 6 branches are untested...',
            },
          ],
        },
      },
    };

    const mockCodeResponse = new CodeAgentResponse(mockCodeResponsePayload);

    it('should correctly map the DTO to a CodeAgentReport entity', () => {
      const result = provider.fromCodeAgentResponse(mockCodeResponse, mockReportId, mockAnalysisId);

      expect(result.id.equals(mockReportId)).toBeTruthy();
      expect(result.analysisId.equals(mockAnalysisId)).toBeTruthy();

      expect(result.metadata.language).toBe('javascript/typescript');
      expect(result.metadata.status).toBe('success');

      expect(result.interpretation.verdict).toBe(VerdictStatus.POOR);
      expect(result.interpretation.executiveSummary.value).toContain(
        'Codebase has 265 static analysis issues',
      );

      const staticAnalysis = result.interpretation.staticAnalysisEvaluation;
      expect(staticAnalysis.totalIssuesAnalyzed).toBe(265);
      expect(staticAnalysis.keyIssuesReasoning).toHaveLength(1);

      const keyIssue = staticAnalysis.keyIssuesReasoning[0];
      expect(keyIssue.file.value).toBe('src/analysis/application/services/start-analysis.as.ts');
      expect(keyIssue.rule).toBe('lint/suspicious/useIterableCallbackReturn');
      expect(keyIssue.severity.value).toBe(SeverityLevel.HIGH);
      expect(keyIssue.location.lineStart).toBe(54);

      const coverage = result.interpretation.coverageEvaluation;
      expect(coverage.overallHealth).toBe('Poor');
      expect(coverage.criticalFilesReasoning).toHaveLength(1);

      const criticalFile = coverage.criticalFilesReasoning[0];
      expect(criticalFile.file.value).toBe(
        'src/analysis/presentation/controllers/pat-controller.controller.ts',
      );
      expect(criticalFile.lineCoveragePct.value).toBe(1);
      expect(criticalFile.missingBranches).toBe(6);
    });

    it('should handle empty or missing fields gracefully in CodeAgentResponse', () => {
      const emptyCodeResponsePayload: CodeAgentResponsePayload = {
        metadata: {
          status: 'success',
        },
        ai_interpretation: {
          verdict: 'UNKNOWN_VERDICT',
          executive_summary: 'No summary provided',
          static_analysis_evaluation: {
            total_issues_analyzed: 0,
            key_issues_reasoning: [],
          },
          coverage_evaluation: {
            overall_health: 'UNKNOWN',
            critical_files_reasoning: [],
          },
        },
      };

      const emptyCodeResponse = new CodeAgentResponse(emptyCodeResponsePayload);

      const result = provider.fromCodeAgentResponse(
        emptyCodeResponse,
        mockReportId,
        mockAnalysisId,
      );

      expect(result.metadata.language).toBe('UNKNOWN');
      expect(result.interpretation.verdict).toBe(VerdictStatus.POOR);
      expect(result.interpretation.staticAnalysisEvaluation.keyIssuesReasoning).toEqual([]);
      expect(result.interpretation.coverageEvaluation.criticalFilesReasoning).toEqual([]);
    });
  });

  describe('fromSecurityAgentResponse', () => {
    const mockSecAgentResponse = {
      analysis_report: {
        metadata: {
          repository: 'test-repo',
          status: 'success',
        },
        grype: [
          {
            path: '/package-lock.json',
            package_name: 'lodash',
            package_version: '4.17.23',
            vulnerability_id: 'GHSA-r5fr-rjxr-66jc',
            severity: 'High',
            description: 'lodash vulnerable to Code Injection via `_.template` imports key names',
            remediation: 'Update lodash to version 4.18.0 or later.',
          },
          {
            path: '/package-lock.json',
            package_name: 'path-to-regexp',
            package_version: '8.3.0',
            vulnerability_id: 'GHSA-j3q9-mxjg-w52f',
            severity: 'High',
            description: 'path-to-regexp vulnerable to Denial of Service',
            remediation: 'Update path-to-regexp to version 8.4.0 or later.',
          },
        ],
        semgrep: [
          {
            rule_id: 'semgrep-rule-001',
            path: '/tmp/my-repo/data/static/codefixes/dbSchemaChallenge_1.ts',
            line: 5,
            severity: 'ERROR',
            description: 'Detected a sequelize statement tainted by user-input.',
            owasp_category: 'A01:2017 - Injection, A03:2021 - Injection, A05:2025 - Injection',
            remediation: 'Use parameterized queries.',
          },
          {
            rule_id: 'semgrep-rule-002',
            path: '/tmp/my-repo/routes/userProfile.ts',
            line: 62,
            severity: 'ERROR',
            description: 'Found data from an Express request flowing to `eval`.',
            owasp_category: 'A03:2021 - Injection, A05:2025 - Injection',
            remediation: 'Avoid using `eval()` with user input.',
          },
        ],
        trivy: [
          {
            rule_id: 'trivy-rule-001',
            path: 'lib/insecurity.ts',
            line: 23,
            severity: 'HIGH',
            description: 'Asymmetric Private Key',
            secret_category: 'AsymmetricPrivateKey',
            remediation: 'Remove the private key from the source code immediately.',
          },
        ],
        errors: [
          {
            tool: 'trivy',
            description: 'Tool execution failed',
          },
        ],
      },
    };

    it('should correctly map the DTO to a SecurityReport entity', () => {
      const mockSecResponse = new SecAgentResponse({
        analysis_report: mockSecAgentResponse.analysis_report,
      });
      const result = provider.fromSecurityAgentResponse(
        mockSecResponse,
        mockReportId,
        mockAnalysisId,
      );

      expect(result.getReportId()).toEqual(mockReportId);
      expect(result.getAnalysisId()).toEqual(mockAnalysisId);

      // DependencyFindings da grype
      expect(result.getDependencyFindings()).toHaveLength(2);
      const dep = result.getDependencyFindings()[0];
      expect(dep.getPathFinding().value).toBe('/package-lock.json');
      expect(dep.getPackageName()).toBe('lodash');
      expect(dep.getPackageVersion()).toBe('4.17.23');
      expect(dep.getVulnerabilityId()).toBe('GHSA-r5fr-rjxr-66jc');
      expect(dep.getSeverityFinding().value).toBe(SeverityLevel.HIGH);
      expect(dep.getDescriptionFinding().value).toContain('lodash vulnerable');
      expect(dep.getRemediation().value).toContain('Update lodash');

      // OWASPFindings da semgrep
      expect(result.getOwaspFindings()).toHaveLength(2);
      const owasp = result.getOwaspFindings()[0];
      expect(owasp.getPathFinding().value).toBe(
        '/tmp/my-repo/data/static/codefixes/dbSchemaChallenge_1.ts',
      );
      expect(owasp.getOWASPCategory()).toBe(
        'A01:2017 - Injection, A03:2021 - Injection, A05:2025 - Injection',
      );
      expect(owasp.getRuleId()).toBe('semgrep-rule-001');
      expect(owasp.getErrorFinding().getErrorLine()).toBe(5);
      expect(owasp.getErrorFinding().getSeverityFinding().value).toBe(SeverityLevel.HIGH);
      expect(owasp.getRemediation().value).toContain('parameterized queries');

      // SecretFindings da trivy
      expect(result.getSecretFindings()).toHaveLength(1);
      const secret = result.getSecretFindings()[0];
      expect(secret.getPathFinding().value).toBe('lib/insecurity.ts');
      expect(secret.getSecretCategory()).toBe('AsymmetricPrivateKey');
      expect(secret.getRuleId()).toBe('trivy-rule-001');
      expect(secret.getErrorFinding().getErrorLine()).toBe(23);
      expect(secret.getErrorFinding().getSeverityFinding().value).toBe(SeverityLevel.HIGH);
      expect(secret.getRemediation().value).toContain('Remove the private key');

      // ToolErrors
      expect(result.getToolErrors()).toHaveLength(1);
      const toolError = result.getToolErrors()[0];
      expect(toolError.getToolName()).toBe('trivy');
      expect(toolError.getDescriptionFinding().value).toBe('Tool execution failed');
    });

    it('should handle empty arrays gracefully', () => {
      const emptyResponse = {
        analysis_report: {
          metadata: { repository: 'test-repo', status: 'success' },
          grype: [],
          semgrep: [],
          trivy: [],
          errors: [],
        },
      };

      const result = provider.fromSecurityAgentResponse(
        emptyResponse as never,
        mockReportId,
        mockAnalysisId,
      );

      expect(result.getDependencyFindings()).toEqual([]);
      expect(result.getOwaspFindings()).toEqual([]);
      expect(result.getSecretFindings()).toEqual([]);
      expect(result.getToolErrors()).toEqual([]);
    });

    it('should normalize severity aliases correctly', () => {
      const responseWithAliases = {
        analysis_report: {
          metadata: { repository: 'test-repo', status: 'success' },
          grype: [
            {
              path: '/package-lock.json',
              package_name: 'lodash',
              package_version: '4.17.23',
              vulnerability_id: 'GHSA-r5fr-rjxr-66jc',
              severity: 'CRITICAL',
              description: 'desc',
              remediation: 'fix',
            },
          ],
          semgrep: [],
          trivy: [],
          errors: [],
        },
      };

      const result = provider.fromSecurityAgentResponse(
        responseWithAliases as never,
        mockReportId,
        mockAnalysisId,
      );

      expect(result.getDependencyFindings()[0].getSeverityFinding().value).toBe(
        SeverityLevel.CRITICAL,
      );
    });

    it('should apply fallback values for missing fields', () => {
      const responseWithMissingFields = {
        analysis_report: {
          metadata: { repository: 'test-repo', status: 'success' },
          grype: [
            {
              path: '',
              package_name: '',
              package_version: '',
              vulnerability_id: 'GHSA-0000-0000-0000',
              severity: '',
              description: '',
              remediation: '',
            },
          ],
          semgrep: [],
          trivy: [],
          errors: [],
        },
      };

      const result = provider.fromSecurityAgentResponse(
        responseWithMissingFields as never,
        mockReportId,
        mockAnalysisId,
      );

      const dep = result.getDependencyFindings()[0];
      expect(dep.getPathFinding().value).toBe('UNKNOWN');
      expect(dep.getPackageName()).toBe('UNKNOWN');
      expect(dep.getPackageVersion()).toBe('UNKNOWN');
      expect(dep.getSeverityFinding().value).toBe(SeverityLevel.MEDIUM);
      expect(dep.getDescriptionFinding().value).toBe('No description provided');
      expect(dep.getRemediation().value).toBe('No remediation provided');
    });
  });
});
