import { AgentRequest } from '../../DTOs/models/requests/agent-request-model.model';
import { DocsAgentResponse } from '../../DTOs/models/responses/docs-agent-response-model.model';

export interface IDocumentationAgentPort {
  runAnalysis(model: AgentRequest): Promise<DocsAgentResponse>;
}
