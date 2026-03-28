export class PATPasswordMock {
  private static readonly value = 'mocked-pat-password';
  constructor() {}
  public get value(): string {
    return PATPasswordMock.value;
  }
}
