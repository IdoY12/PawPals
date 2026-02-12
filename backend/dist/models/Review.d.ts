import mongoose, { Document, Model } from 'mongoose';
export interface IReview extends Document {
    _id: mongoose.Types.ObjectId;
    reviewerId: mongoose.Types.ObjectId;
    revieweeId: mongoose.Types.ObjectId;
    requestId?: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: Model<IReview>;
export default Review;
//# sourceMappingURL=Review.d.ts.map