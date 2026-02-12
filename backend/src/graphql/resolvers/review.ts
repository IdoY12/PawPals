import mongoose from 'mongoose';
import { Review, IReview } from '../../models/Review';
import { User } from '../../models/User';
import { Request } from '../../models/Request';
import {
  throwAuthError,
  throwValidationError,
  throwNotFoundError,
  throwForbiddenError,
} from '../../utils/validation';
import { GraphQLContext } from '../../config/apollo';

// Input types
interface CreateReviewInput {
  revieweeId: string;
  requestId?: string;
  rating: number;
  comment: string;
}

export const reviewResolvers = {
  Query: {
    // Get reviews for a user
    getUserReviews: async (
      _: unknown,
      { userId, limit = 20, offset = 0 }: { userId: string; limit?: number; offset?: number }
    ): Promise<IReview[]> => {
      return Review.find({ revieweeId: userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
    },

    // Get review stats for a user
    getUserReviewStats: async (
      _: unknown,
      { userId }: { userId: string }
    ): Promise<{ average: number; count: number }> => {
      const result = await Review.aggregate([
        { $match: { revieweeId: new mongoose.Types.ObjectId(userId) } },
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
    canReview: async (
      _: unknown,
      { revieweeId, requestId }: { revieweeId: string; requestId?: string },
      { user }: GraphQLContext
    ): Promise<boolean> => {
      if (!user) return false;

      // Can't review yourself
      if (user._id.toString() === revieweeId) {
        return false;
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        reviewerId: user._id,
        revieweeId,
        ...(requestId && { requestId }),
      });

      return !existingReview;
    },
  },

  Mutation: {
    // Create a review
    createReview: async (
      _: unknown,
      { input }: { input: CreateReviewInput },
      { user }: GraphQLContext
    ): Promise<IReview> => {
      if (!user) throwAuthError();

      const { revieweeId, requestId, rating, comment } = input;

      // Can't review yourself
      if (user._id.toString() === revieweeId) {
        throwValidationError('You cannot review yourself');
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throwValidationError('Rating must be between 1 and 5');
      }

      // Validate comment
      if (comment.trim().length < 10) {
        throwValidationError('Review comment must be at least 10 characters');
      }

      // Check if reviewee exists
      const reviewee = await User.findById(revieweeId);
      if (!reviewee) {
        throwNotFoundError('User to review');
      }

      // If requestId provided, validate it
      if (requestId) {
        const request = await Request.findById(requestId);
        if (!request) {
          throwNotFoundError('Request');
        }
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        reviewerId: user._id,
        revieweeId,
        ...(requestId && { requestId }),
      });

      if (existingReview) {
        throwValidationError('You have already reviewed this user');
      }

      // Create review
      const review = new Review({
        reviewerId: user._id,
        revieweeId: new mongoose.Types.ObjectId(revieweeId),
        ...(requestId && { requestId: new mongoose.Types.ObjectId(requestId) }),
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
    id: (parent: IReview) => parent._id.toString(),
    reviewer: async (parent: IReview) => {
      return User.findById(parent.reviewerId);
    },
    reviewee: async (parent: IReview) => {
      return User.findById(parent.revieweeId);
    },
  },
};
