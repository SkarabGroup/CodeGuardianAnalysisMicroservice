def merge_trivy_findings(raw_findings, agent_findings):
    merged = {}

    def make_key(f):
        return (
            f["rule_id"], 
            f["path"],
            f["line"],
            f["severity"]
        )

    for f in raw_findings:
        merged[make_key(f)] = f

    for f in agent_findings:
        key = make_key(f)
        
        if key not in merged:
            merged[key] = f
            continue
        
        existing = merged[key]

        merged[key] = {
            **existing,
            **{k: v for k, v in f.items() if v is not None}
        }
    
    return list(merged.values())