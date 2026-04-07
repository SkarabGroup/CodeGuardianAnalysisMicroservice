export class UpdatePatResult {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): UpdatePatResult {
    return new UpdatePatResult(true);
  }

  public static failure(errorMessage: string): UpdatePatResult {
    return new UpdatePatResult(false, errorMessage);
  }
}
