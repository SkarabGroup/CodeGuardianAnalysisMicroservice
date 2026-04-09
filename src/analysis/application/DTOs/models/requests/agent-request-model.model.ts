import { AnalysisId } from '../../../../domain/value-objects/analysis-id.vo';

export class AgentRequest {
  constructor(public readonly id: AnalysisId) {}
}
