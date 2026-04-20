export class AddRepositoryCollectionRequestDTO {
  constructor(
    public readonly url: string,
    public readonly name: string,
    public readonly description?: string,
  ) {}
}
