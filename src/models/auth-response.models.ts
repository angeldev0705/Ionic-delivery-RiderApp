import { User } from "./user.models";

export class AuthResponse {
    token: string;
    user: User;
}