export class CheckAvailabilityResponseModel {
  constructor(
    public readonly isAccessible: boolean,
    public readonly commit: string | null,
    public readonly errorMessage?: string,
  ) {}
}
