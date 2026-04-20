import { AgentRequest } from '../../DTOs/models/requests/agent-request-model.model';
import { CodeAgentResponse } from '../../DTOs/models/responses/code-agent-response-model.model';

export interface ICodeAgentPort {
  runAnalysis(model: AgentRequest): Promise<CodeAgentResponse>;
}
