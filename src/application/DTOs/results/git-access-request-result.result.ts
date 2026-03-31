export type GitAccessRequestStatus = 'EXISTS' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'UNAVAILABLE';

export class GitAccessRequestResult {
  constructor(public readonly status: GitAccessRequestStatus) {}
}
