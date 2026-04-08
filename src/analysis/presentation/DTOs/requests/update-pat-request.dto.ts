export class UpdatePatRequestDTO {
  constructor(
    public readonly repositoryUrl: string,
    public readonly password: string,
    public readonly newPersonalAccessToken: string,
  ) {}
}
