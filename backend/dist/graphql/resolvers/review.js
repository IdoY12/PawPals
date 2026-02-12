"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewResolvers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Review_1 = require("../../models/Review");
const User_1 = require("../../models/User");
const Request_1 = require("../../models/Request");
const validation_1 = require("../../utils/validation");
exports.reviewResolvers = {
    Query: {
        // Get reviews for a user
        getUserReviews: async (_, { userId, limit = 20, offset = 0 }) => {
            return Review_1.Review.find({ revieweeId: userId })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit);
        },
        // Get review stats for a user
        getUserReviewStats: async (_, { userId }) => {
            const result = await Review_1.Review.aggregate([
                { $match: { revieweeId: new mongoose_1.default.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$revieweeId',
                        averageRating: { $avg: '$rating' },
                        count: { $sum: 1 },
                    },
                },
            ]);
            if (result.length === 0) {
                return { average: 0, count: 0 };
            }
            return {
                average: Math.round(result[0].averageRating * 10) / 10,
                count: result[0].count,
            };
        },
        // Check if current user can review another user
        canReview: async (_, { revieweeId, requestId }, { user }) => {
            if (!user)
                return false;
            // Can't review yourself
            if (user._id.toString() === revieweeId) {
                return false;
            }
            // Check if already reviewed
            const existingReview = await Review_1.Review.findOne({
                reviewerId: user._id,
                revieweeId,
                ...(requestId && { requestId }),
            });
            return !existingReview;
        },
    },
    Mutation: {
        // Create a review
        createReview: async (_, { input }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const { revieweeId, requestId, rating, comment } = input;
            // Can't review yourself
            if (user._id.toString() === revieweeId) {
                (0, validation_1.throwValidationError)('You cannot review yourself');
            }
            // Validate rating
            if (rating < 1 || rating > 5) {
                (0, validation_1.throwValidationError)('Rating must be between 1 and 5');
            }
            // Validate comment
            if (comment.trim().length < 10) {
                (0, validation_1.throwValidationError)('Review comment must be at least 10 characters');
            }
            // Check if reviewee exists
            const reviewee = await User_1.User.findById(revieweeId);
            if (!reviewee) {
                (0, validation_1.throwNotFoundError)('User to review');
            }
            // If requestId provided, validate it
            if (requestId) {
                const request = await Request_1.Request.findById(requestId);
                if (!request) {
                    (0, validation_1.throwNotFoundError)('Request');
                }
            }
            // Check if already reviewed
            const existingReview = await Review_1.Review.findOne({
                reviewerId: user._id,
                revieweeId,
                ...(requestId && { requestId }),
            });
            if (existingReview) {
                (0, validation_1.throwValidationError)('You have already reviewed this user');
            }
            // Create review
            const review = new Review_1.Review({
                reviewerId: user._id,
                revieweeId: new mongoose_1.default.Types.ObjectId(revieweeId),
                ...(requestId && { requestId: new mongoose_1.default.Types.ObjectId(requestId) }),
                rating,
                comment: comment.trim(),
            });
            await review.save();
            // Update reviewee's rating (handled in post-save hook)
            return review;
        },
    },
    // Field resolvers
    Review: {
        id: (parent) => parent._id.toString(),
        reviewer: async (parent) => {
            return User_1.User.findById(parent.reviewerId);
        },
        reviewee: async (parent) => {
            return User_1.User.findById(parent.revieweeId);
        },
    },
};
//# sourceMappingURL=review.js.map