import { Profile } from "./profile.models";
import { User } from "./user.models";

export class Ride {
    id: number;
    driver_id: number;
    user_id: number;
    vehicle_type_id: number;
    is_scheduled: number;
    estimated_distance: number;
    estimated_time: number;
    estimated_fare: number;
    final_fare: number;
    myRating: number;
    estimated_pickup_time: number;
    estimated_pickup_distance: number;
    latitude_from: string;
    longitude_from: string;
    latitude_to: string;
    longitude_to: string;
    status: string;
    address_from: string;
    address_to: string;
    created_at: string;
    driver: Profile;
    user: User;
}