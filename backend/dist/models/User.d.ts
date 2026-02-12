import mongoose, { Document, Model } from 'mongoose';
export interface IDog {
    name: string;
    breed: string;
    age: number;
    photo?: string;
    description?: string;
}
export interface ILocation {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
}
export declare enum UserType {
    OWNER = "owner",
    SITTER = "sitter"
}
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    userType: UserType;
    name: string;
    phone?: string;
    profilePicture?: string;
    location: ILocation;
    dogs: IDog[];
    isAvailable: boolean;
    availabilityMessage?: string;
    hourlyRate?: number;
    bio?: string;
    rating: number;
    reviewCount: number;
    totalRatingSum: number;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    updateRating(newRating: number): Promise<void>;
}
export declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=User.d.ts.map