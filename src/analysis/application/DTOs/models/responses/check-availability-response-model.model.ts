export class CheckAvailabilityResponse {
  constructor(
    public readonly isAccessible: boolean,
    public readonly commit: string | null,
    public readonly errorMessage?: string,
  ) {}

  public static success(sha: string): CheckAvailabilityResponse {
    return new CheckAvailabilityResponse(true, sha);
  }

  public static failure(message: string): CheckAvailabilityResponse {
    return new CheckAvailabilityResponse(false, null, message);
  }
}
