export class PostPatRequestDTO {
    constructor(
        public readonly repositoryUrl: string,
        public readonly password: string,
        public readonly personalAccessToken: string
    ) {}
}