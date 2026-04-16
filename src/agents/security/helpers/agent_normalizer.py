import json

def normalize_agent_output(raw):
    if isinstance(raw, dict):
        data = raw

    elif isinstance(raw, str):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {
                "trivy": [],
                "semgrep": [],
                "grype": [],
                "errors": [{
                    "tool": "agent",
                    "message": "Invalid JSON string from agent",
                    "details": raw[:500]
                }]
            }

    else:
        if hasattr(raw, "content"):
            content = raw.content
        elif hasattr(raw, "text"):
            content = raw.text
        else:
            content = str(raw)

        try:
            data = json.loads(content)
        except Exception:
            return {
                "trivy": [],
                "semgrep": [],
                "grype": [],
                "errors": [{
                    "tool": "agent",
                    "message": "Unable to decode agent output",
                    "details": content[:500]
                }]
            }

    return {
        "trivy": data.get("trivy", []),
        "semgrep": data.get("semgrep", []),
        "grype": data.get("grype", []),
        "errors": data.get("errors", [])
    }