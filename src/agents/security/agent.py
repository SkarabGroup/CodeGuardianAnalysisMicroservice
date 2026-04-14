from strands import Agent
from strands.models import BedrockModel
from tools.semgrep_functions import run_semgrep
from tools.trivy_functions import run_trivy
from tools.grype_functions import run_grype


model = BedrockModel(
    model_id="amazon.nova-pro-v1:0",
    region_name="eu-north-1"
)

SYSTEM_PROMPT = """
You are a security analysis agent for software repositories.
You should use all available tools:
- run_semgrep
- run_trivy
- run_grype
If "status"="success" after collecting results, add remediation by thinking.

Structure every finding taken from grype like this:
{
  "path": "...",
  "vulnerability_id": "...",
  "severity": "...",
  "description: "...",
  "package_name": "...",
  "package_version": "...",
  "remediation": "...",
}

Structure every finding taken from semgrep like this:
{
  "path": "...",
  "error_severity": "...",
  "error_description: "...",
  "error_line": "...",
  "owasp_category": "...",
  "remediation": "...",
}

Structure every finding taken from trivy like this:
{
  "path": "...",
  "error_severity": "...",
  "error_description: "...",
  "error_line": "...",
  "secret_category": "...",
  "remediation": "...",
}

Then in the final report, group every finding into an array based on the type of finding:
{
  "semgrep": {...},
  "trivy": {...},
  "grype": {...},
}

Rules:
- Do NOT invent findings
- Use ONLY tool outputs
- Keep JSON valid
IMPORTANT:
- Pass this exact path to every tool
"""

def create_security_agent():
    return Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[run_semgrep, run_trivy, run_grype]
    )

def analyze_repository(repo_path: str) -> str:
    agent = create_security_agent()
    
    user_message = f"""
    Please perform a complete security analysis of the repository located at: {repo_path}
    
    Use all available tools and provide a valid security report.
    """
    
    response = agent(user_message)
    return str(response)