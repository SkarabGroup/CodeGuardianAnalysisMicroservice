import { CodeAgentReport } from '../../../../src/analysis/domain/entities/code-agent-report.entity';
import { CodeAgentMetadata } from '../../../../src/analysis/domain/value-objects/code-agent-metadata.vo';
import { AIInterpretation } from '../../../../src/analysis/domain/value-objects/ai-interpretation.vo';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';

describe('CodeAgentReport (Entity)', () => {
  const ridStr = '018d879a-ff0f-769b-b558-e930b71aaa5b';
  const rid = ReportId.create('018d879a-ff0f-769b-b558-e930b71aaa5b');
  const aid = AnalysisId.create('018d879a-ff0f-769b-b558-e930b71aaa5b');
  const meta = CodeAgentMetadata.create('typescript', 'success');

  // Usiamo un mock per l'interpretazione per isolare il test dell'entity
  const interp = {} as AIInterpretation;

  it('should create a new report instance', () => {
    const report = CodeAgentReport.create(rid, aid, meta, interp);

    expect(report.id).toBe(rid);
    expect(report.analysisId).toBe(aid);
    expect(report.metadata).toBe(meta);
    expect(report.interpretation).toBe(interp);
  });

  describe('equals', () => {
    it('should return true if report IDs are equal', () => {
      const report1 = CodeAgentReport.create(rid, aid, meta, interp);
      const sameRid = ReportId.create(ridStr);
      const report2 = CodeAgentReport.create(sameRid, aid, meta, interp);

      expect(report1.equals(report2)).toBe(true);
    });

    it('should return false if report IDs are different', () => {
      const report1 = CodeAgentReport.create(rid, aid, meta, interp);
      const differentRid = ReportId.create('018d879a-ff0f-769b-b558-e930b71aaa5c');
      const report2 = CodeAgentReport.create(differentRid, aid, meta, interp);

      expect(report1.equals(report2)).toBe(false);
    });

    it('should return false if compared with a different type or null', () => {
      const report = CodeAgentReport.create(rid, aid, meta, interp);

      expect(report.equals(null)).toBe(false);
      expect(report.equals({})).toBe(false);
    });
  });
});
