export class NewPatResult {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly errorMessage?: string,
  ) {}

  public static success(): NewPatResult {
    return new NewPatResult(true);
  }

  public static failure(errorMessage: string): NewPatResult {
    return new NewPatResult(false, errorMessage);
  }
}
