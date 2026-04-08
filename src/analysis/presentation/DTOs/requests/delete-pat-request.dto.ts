export class DeletePatRequestDTO {
  constructor(
    public readonly repositoryUrl: string,
    public readonly password: string,
  ) {}
}
