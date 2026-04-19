import sys
import json
from agent import analyze_repository
from helpers.aggregate_findings import aggregate_findings


def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <repo_path>", file=sys.stderr)
        sys.exit(1)

    repo_path = sys.argv[1]

    try:
        agent_result = analyze_repository(repo_path)
    except Exception as e:
        print(f"[CRITICAL] Agent execution failed: {e}", file=sys.stderr)
        sys.exit(1)

    enriched_result = aggregate_findings(agent_result, repo_path)

    print(json.dumps(enriched_result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()