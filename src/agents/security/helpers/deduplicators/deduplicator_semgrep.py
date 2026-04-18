def dedupe(findings):
    seen = set()
    result = []
    for f in findings:
        key = (
            f["path"],
            f["line"],
            f["rule_id"],
            f["severity"]
        )
        if key not in seen:
            seen.add(key)
            result.append(f)
    return result