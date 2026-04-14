import sys
import json
import os
import re
from dotenv import load_dotenv
from agent import analyze_repository

def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <repo_path>")
        sys.exit(1)

    repo_path = sys.argv[1]

    print(f"[INFO] Starting security analysis for: {repo_path}\n")

    try:
        result = analyze_repository(repo_path)
        print("\n=== FINAL REPORT ===\n")
        print(result)

    except Exception as e:
        print("\n[ERROR] Agent execution failed:")
        print(str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()