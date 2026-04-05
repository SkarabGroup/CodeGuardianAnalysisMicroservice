export class CloneRepoResponse {
  private constructor(
    public readonly cloned: boolean,
    public readonly localFolderPath?: string,
    public readonly errorMessage?: string,
  ) {}

  public static success(path: string): CloneRepoResponse {
    return new CloneRepoResponse(true, path);
  }

  public static failure(error: string): CloneRepoResponse {
    return new CloneRepoResponse(false, undefined, error);
  }
}
