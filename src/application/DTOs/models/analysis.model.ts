export abstract class AnalysisModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly status: string,
  ) {}
}
