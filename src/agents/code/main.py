import sys
import json
import os
from dotenv import load_dotenv
from strands import Agent

# Importiamo tutti i tool che hai magistralmente creato
from tools.static_analysis_python import python_static_analysis
from tools.static_analysis_js_ts import js_ts_static_analysis
from tools.static_analysis_java import java_static_analysis
from tools.coverage_python import python_coverage_analysis
from tools.coverage_js_ts import js_ts_coverage_analysis
from tools.coverage_java import java_coverage_analysis

def main():
    load_dotenv()
    print('Docker started', file=sys.stderr)

    if len(sys.argv) < 2:
        print(json.dumps({"error": "Repository not found."}))
        sys.exit(1)

    target_dir = sys.argv[1]
    print(f"Target directory to analyze: {target_dir}", file=sys.stderr)

    if not os.path.exists(target_dir):
        print(json.dumps({"error": f"The directory {target_dir} doesn't exist inside the container"}), file=sys.stderr)
        sys.exit(1)

    try:
        top_level_files = os.listdir(target_dir)
    except Exception as e:
        top_level_files = []

    print(f"--- Starting AI Agent Orchestration ---", file=sys.stderr)

    all_tools = [
        python_static_analysis, js_ts_static_analysis, java_static_analysis,
        python_coverage_analysis, js_ts_coverage_analysis, java_coverage_analysis
    ]

    system_prompt = """
    You are an autonomous Senior Code Analysis Orchestrator.
    Your mission is to analyze a code repository by strategically invoking the correct static analysis tools.

    ### 1. LANGUAGE DETECTION
    Analyze the provided top-level files and directory name to determine the repository's primary language:
    - If you see `pom.xml`: The language is Java.
    - If you see `package.json` or any JS lockfile (`npm`, `yarn`, `pnpm`): The language is JavaScript/TypeScript.
    - If you see `.py` files, `requirements.txt`, `setup.py`, or `Pipfile`: The language is Python.

    ### 2. TOOL EXECUTION
    Based ONLY on the detected language, you MUST invoke exactly ONE tools:
    - ONE Static Analysis tool (e.g., java_static_analysis, js_ts_static_analysis, or python_static_analysis).
    Never invoke tools for a language that does not match the repository.

    ### 3. ERROR HANDLING
    If a tool returns an error payload (e.g., {"status": "error", "message": "..."}), DO NOT halt or attempt to fix it. 
    Embed the error JSON directly into your final output under the respective section and set the overall `analysis_status` to "partial_failure" (or "failure" if both fail).

    ### 4. STRICT OUTPUT RULES
    - ZERO CONVERSATION: You must not output any greetings, chain-of-thought, or explanations.
    - NO MARKDOWN: Do not wrap your response in markdown code blocks (e.g., NO ```json ... ```).
    - PURE JSON: Your entire output must be a single, valid, parseable JSON object.
    - NO MUTATION: Do not alter or summarize the JSON payloads returned by the tools. Inject them exactly as they are.

    ### REQUIRED JSON SCHEMA
    {
    "metadata": {
        "repository": "<target_directory_path>",
        "language": "<java|javascript/typescript|python>",
        "analysis_status": "<success|partial_failure|failure>"
    },
    "static_analysis": {
        ... inject the exact JSON object returned by the static analysis tool ...
    },
    }
    """

    agent = Agent(
        tools=all_tools, 
        system_prompt=system_prompt,
        model=os.getenv("AGENT_MODEL_ID")
    )

    prompt = (
        f"Analyze the repository at: {target_dir}. "
        f"The root directory contains these files: {top_level_files}. "
        "Determine the language, run the two appropriate tools, and return the combined JSON."
    )

    try:
        final_json_response = agent(prompt)
        
        print(final_json_response)
        
    except Exception as e:
        print(f"Agent Orchestration Failed: {e}", file=sys.stderr)
        fallback = {"metadata": {"analysis_status": "failure", "error": str(e)}}
        print(json.dumps(fallback))
        sys.exit(1)

    print("--- AI Analysis ended ---", file=sys.stderr)

if __name__ == "__main__":
    main()