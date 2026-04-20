export class CheckAvailabilityResponse {
  constructor(
    public readonly isAccessible: boolean,
    public readonly branch: string | null,
    public readonly commit: string | null,
    public readonly errorMessage?: string,
  ) {}

  public static success(branch: string, commit: string | null): CheckAvailabilityResponse {
    return new CheckAvailabilityResponse(true, branch, commit);
  }

  public static failure(message: string): CheckAvailabilityResponse {
    return new CheckAvailabilityResponse(false, null, null, message);
  }
}
