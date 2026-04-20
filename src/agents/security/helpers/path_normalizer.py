import os

def normalize_path(path: str, repo_path: str) -> str:
  if os.path.isabs(path) and path.startswith(repo_path):
    return os.path.relpath(path, repo_path)

  return path.lstrip("/")