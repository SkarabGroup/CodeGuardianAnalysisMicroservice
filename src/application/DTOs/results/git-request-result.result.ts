export type GitRequestStatus = 'EXIST' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'UNAVAILABLE';

export class GitRequestResult {
  constructor(public readonly status: GitRequestStatus) {}
}
