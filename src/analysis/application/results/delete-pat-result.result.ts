export class DeletePatResult {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): DeletePatResult {
    return new DeletePatResult(true);
  }

  public static failure(errorMessage: string): DeletePatResult {
    return new DeletePatResult(false, errorMessage);
  }
}
