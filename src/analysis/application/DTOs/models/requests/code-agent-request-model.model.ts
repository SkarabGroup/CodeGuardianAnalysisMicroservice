import { AnalysisId } from '../../../../domain/value-objects/analysis-id.vo';

export class CodeAgentRequest {
  constructor(public readonly id: AnalysisId) {}
}
