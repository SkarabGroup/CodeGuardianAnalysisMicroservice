export class CloneRepoResponse {
  constructor(
    public readonly success: boolean,
    public readonly localFolderPath?: string,
    public readonly errorMessage?: string,
  ) {}
}
