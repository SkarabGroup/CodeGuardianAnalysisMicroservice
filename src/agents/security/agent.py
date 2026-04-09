from strands import Agent
from strands.models import BedrockModel
from tools.semgrep_tool import run_semgrep
from tools.trivy_tool import run_trivy
from tools.syft_grype_tool import run_grype


model = BedrockModel(
    model_id="us.nova.micro",
    region_name="eu-north-1"
)

SYSTEM_PROMPT = """
You are a security analysis agent for software repositories.
You should use all available tools:
- run_semgrep
- run_trivy_secrets
- run_grype
After collecting results, produce:

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
  "grype": {...}
  "critical_findings": [...],
  "recommendations": [...]
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