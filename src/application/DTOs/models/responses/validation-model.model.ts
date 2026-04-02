export class ValidationModel {
  constructor(
    public readonly isValid: boolean,
    public readonly personalAccessToken: string | null = null,
    public readonly message: string,
  ) {}
}
