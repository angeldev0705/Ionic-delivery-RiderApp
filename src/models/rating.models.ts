import { RatingSummary } from "./rating-summary.models";

export class Rating {
    average_rating: string;
    total_ratings: number;
    total_completed: number;
    summary: Array<RatingSummary>;
}