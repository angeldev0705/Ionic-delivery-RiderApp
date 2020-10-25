import { User } from "./user.models";
import { Ride } from "./ride.models";

export class WalletHistory {
    id: number;
    user_id: number;
    title: string;
    description: string;
    status: string;
    amount: number;
    ride: Ride;
    user: User;
    updated_at: string;
    created_at: string;
}