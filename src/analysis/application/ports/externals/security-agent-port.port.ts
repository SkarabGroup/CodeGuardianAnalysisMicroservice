import { AgentRequest } from '../../DTOs/models/requests/agent-request-model.model';
import { SecAgentResponse } from '../../DTOs/models/responses/security-agent-response-model.model';

export interface ISecurityAgentPort {
  runAnalysis(model: AgentRequest): Promise<SecAgentResponse>;
}
