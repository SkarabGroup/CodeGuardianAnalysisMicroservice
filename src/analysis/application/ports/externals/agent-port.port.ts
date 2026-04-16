import { AgentRequest } from '../../DTOs/models/requests/agent-request-model.model';
import { AgentResponse } from '../../DTOs/models/responses/security-agent-response-model.model';

export interface IAgentPort {
  runAnalysis(model: AgentRequest): Promise<AgentResponse>;
}
