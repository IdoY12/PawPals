import mongoose, { Document, Model } from 'mongoose';
export declare enum RequestStatus {
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface IRequestLocation {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
}
export interface IRequest extends Document {
    _id: mongoose.Types.ObjectId;
    ownerId: mongoose.Types.ObjectId;
    message: string;
    startDate: Date;
    endDate: Date;
    location: IRequestLocation;
    status: RequestStatus;
    specialInstructions?: string;
    preferredRate?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Request: Model<IRequest>;
export default Request;
//# sourceMappingURL=Request.d.ts.map