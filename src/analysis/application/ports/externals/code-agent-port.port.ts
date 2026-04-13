import { CodeAgentRequest } from '../../DTOs/models/requests/code-agent-request-model.model';
import { CodeAgentResponse } from '../../DTOs/models/responses/code-agent-response-model.model';

export interface ICodeAgentPort {
  runAnalysis(model: CodeAgentRequest): Promise<CodeAgentResponse>;
}
