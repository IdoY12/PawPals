import mongoose from 'mongoose';
import { IReview } from '../../models/Review';
import { GraphQLContext } from '../../config/apollo';
interface CreateReviewInput {
    revieweeId: string;
    requestId?: string;
    rating: number;
    comment: string;
}
export declare const reviewResolvers: {
    Query: {
        getUserReviews: (_: unknown, { userId, limit, offset }: {
            userId: string;
            limit?: number;
            offset?: number;
        }) => Promise<IReview[]>;
        getUserReviewStats: (_: unknown, { userId }: {
            userId: string;
        }) => Promise<{
            average: number;
            count: number;
        }>;
        canReview: (_: unknown, { revieweeId, requestId }: {
            revieweeId: string;
            requestId?: string;
        }, { user }: GraphQLContext) => Promise<boolean>;
    };
    Mutation: {
        createReview: (_: unknown, { input }: {
            input: CreateReviewInput;
        }, { user }: GraphQLContext) => Promise<IReview>;
    };
    Review: {
        id: (parent: IReview) => string;
        reviewer: (parent: IReview) => Promise<(mongoose.Document<unknown, {}, import("../../models/User").IUser, {}, {}> & import("../../models/User").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null>;
        reviewee: (parent: IReview) => Promise<(mongoose.Document<unknown, {}, import("../../models/User").IUser, {}, {}> & import("../../models/User").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null>;
    };
};
export {};
//# sourceMappingURL=review.d.ts.map