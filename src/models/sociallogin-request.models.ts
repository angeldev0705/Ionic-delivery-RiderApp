export class SocialLoginRequest {
    platform: string;
    token: string;
    constructor(token: string, platform: string) {
        this.token = token;
        this.platform = platform;
    }
}