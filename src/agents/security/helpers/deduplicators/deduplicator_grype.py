def dedupe(findings):
    seen = set()
    result = []

    for f in findings:
        key = (
            f["path"],
            f["package_name"],
            f["package_version"],
            f["vulnerability_id"],
            f["severity"],
        )

        if key not in seen:
            seen.add(key)
            result.append(f)

    return result