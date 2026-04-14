import { CodeAgentReport } from '../../../../src/analysis/domain/entities/code-agent-report.entity';
import { CodeAgentMetadata } from '../../../../src/analysis/domain/value-objects/code-agent-metadata.vo';
import { AIInterpretation } from '../../../../src/analysis/domain/value-objects/ai-interpretation.vo';
import { ReportId } from '../../../../src/analysis/domain/value-objects/report-id.vo';
import { AnalysisId } from '../../../../src/analysis/domain/value-objects/analysis-id.vo';

describe('CodeAgentReport (Entity)', () => {
  const rid = ReportId.create('018d879a-ff0f-769b-b558-e930b71aaa5b');
  const aid = AnalysisId.create('018d879a-ff0f-769b-b558-e930b71aaa5b');
  const meta = CodeAgentMetadata.create('typescript', 'success');

  // Usiamo un mock per l'interpretazione per isolare il test dell'entity
  const interp = {} as AIInterpretation;

  it('should create a new report instance with the current date', () => {
    const report = CodeAgentReport.create(rid, aid, meta, interp);

    expect(report.id).toBe(rid);
    expect(report.analysisId).toBe(aid);
    expect(report.createdAt).toBeInstanceOf(Date);
    expect(report.metadata).toBe(meta);
    expect(report.interpretation).toBe(interp);
    expect(Math.abs(report.createdAt.getTime() - Date.now())).toBeLessThan(1000);
  });

  it('should restore an existing report instance with a specific past date', () => {
    const pastDate = new Date('2022-05-20T10:00:00Z');
    const report = CodeAgentReport.restore(rid, aid, meta, interp, pastDate);

    expect(report.createdAt).toEqual(pastDate);
  });
});
