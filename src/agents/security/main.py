import sys
import json
import os
import tarfile
import boto3
from agent import analyze_repository
from helpers.aggregate_findings import aggregate_findings

def main():
    # --- INIZIO LOGICA CLOUD ---
    analysis_id = os.environ.get("ANALYSIS_ID")
    bucket_name = os.environ.get("S3_BUCKET_NAME")
    region = os.environ.get("AWS_REGION", "eu-central-1")

    if analysis_id and bucket_name:
        # Configurazione path S3 (Coerente con NestJS Adapter)
        input_key = f"jobs/{analysis_id}/input.tar.gz"
        tar_path = f"/tmp/{analysis_id}_input.tar.gz"
        repo_path = f"/tmp/{analysis_id}"
        
        print(f"[CLOUD] Downloading {input_key}...", file=sys.stderr)
        s3 = boto3.client("s3", region_name=region)
        s3.download_file(bucket_name, input_key, tar_path)

        os.makedirs(repo_path, exist_ok=True)
        with tarfile.open(tar_path, "r:gz") as tf:
            tf.extractall(repo_path)
        os.remove(tar_path)
    else:
        # Logica locale originale
        if len(sys.argv) < 2:
            print("Usage: python main.py <repo_path>", file=sys.stderr)
            sys.exit(1)
        repo_path = sys.argv[1]
    # --- FINE LOGICA CLOUD ---

    try:
        # Flusso originale invariato
        agent_result = analyze_repository(repo_path)
        enriched_result = aggregate_findings(agent_result, repo_path)
        
        # --- LOGICA DI OUTPUT ---
        if analysis_id and bucket_name:
            output_key = f"jobs/{analysis_id}/security_report.json"
            print(f"[CLOUD] Uploading report to {output_key}...", file=sys.stderr)
            s3.put_object(
                Bucket=bucket_name,
                Key=output_key,
                Body=json.dumps(enriched_result, indent=2, ensure_ascii=False),
                ContentType='application/json'
            )
        else:
            print(json.dumps(enriched_result, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"[CRITICAL] Execution failed: {e}", file=sys.stderr)
        # Upload del fallimento su S3 per notificare NestJS
        if analysis_id and bucket_name:
            s3.put_object(
                Bucket=bucket_name,
                Key=f"jobs/{analysis_id}/security_report.json",
                Body=json.dumps({"analysis_report": {"metadata": {"status": "failed"}, "errors": [{"tool": "main", "message": str(e)}]}}),
                ContentType='application/json'
            )
        sys.exit(1)

if __name__ == "__main__":
    main()