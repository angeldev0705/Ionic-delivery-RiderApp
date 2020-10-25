import { VehicleType } from "./vehicle-type.models";

export class ProfileUpdateRequest {
    vehicle_type_id: number;
    vehicle_details: string;
    vehicle_number: string;
    document_url: string;
    license_url: string;
    current_latitude: string;
    current_longitude: string;
    is_online: number;
    vehicle_type: VehicleType;
}