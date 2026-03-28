export class AnalysisModel {
  constructor(
    public readonly analysisId: string,
    public readonly userId: string,
    public readonly status: string,
  ) {}
}
