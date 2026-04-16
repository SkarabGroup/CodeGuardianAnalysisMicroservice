def merge_semgrep_findings(raw_findings, agent_findings):
    merged = {}

    def make_key(f):
        return (
            f["rule_id"],
            f["path"],
            f["line"],
            f["severity"]
        )

    for f in raw_findings:
        key = make_key(f)
        merged[key] = f

    for f in agent_findings:
        key = make_key(f)
        if key not in merged:
            merged[key] = f
        else:
            existing = merged[key]

            if not existing.get("remediation") and f.get("remediation"):
                merged[key] = f
            elif f.get("remediation"):
                merged[key] = f
    
    return list(merged.values())