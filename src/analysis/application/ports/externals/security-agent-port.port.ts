import { AgentRequest } from '../../DTOs/models/requests/agent-request-model.model';
import { SecurityAgentResponse } from '../../DTOs/models/responses/security-agent-response-model.model';

export interface ISecurityAgentPort{
  runAnalysis(model: AgentRequest): Promise <SecurityAgentResponse>;
}
