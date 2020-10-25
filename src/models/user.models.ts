import { Wallet } from "./wallet-info.models";

export class User {
    id: number;
    active: number;
    confirmed: number;
    mobile_verified: number;
    fcm_registration_id_driver: string;
    name: string;
    email: string;
    mobile_number: string;
    image_url: string;
    profession: string;
    refer_code: string;
    ratings: number;
    ratingscount: number;
    wallet: Wallet;
}