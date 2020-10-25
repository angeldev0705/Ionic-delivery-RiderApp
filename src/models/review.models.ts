import { User } from "./user.models";

export class Review {
    id: number;
    rating: number;
    review: string;
    created_at: string;
    rating_to: User;
    rating_from: User;
}