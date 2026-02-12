import mongoose, { Document, Schema, Model } from 'mongoose';
import User from './User';

// Review document interface
export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  requestId?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Review schema
const ReviewSchema = new Schema<IReview>(
  {
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
      index: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee ID is required'],
      index: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'Request',
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reviews
ReviewSchema.index({ reviewerId: 1, revieweeId: 1, requestId: 1 }, { unique: true });

// Index for fetching reviews by reviewee
ReviewSchema.index({ revieweeId: 1, createdAt: -1 });

// Post-save hook to update user rating
ReviewSchema.post('save', async function(doc) {
  try {
    const user = await User.findById(doc.revieweeId);
    if (user) {
      await user.updateRating(doc.rating);
    }
  } catch (error) {
    console.error('Error updating user rating:', error);
  }
});

// Static method to get average rating for a user
ReviewSchema.statics.getAverageRating = async function(
  userId: mongoose.Types.ObjectId
): Promise<{ average: number; count: number }> {
  const result = await this.aggregate([
    { $match: { revieweeId: userId } },
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
};

// Static method to check if user can review
ReviewSchema.statics.canReview = async function(
  reviewerId: mongoose.Types.ObjectId,
  revieweeId: mongoose.Types.ObjectId,
  requestId?: mongoose.Types.ObjectId
): Promise<boolean> {
  // Check if a review already exists
  const existingReview = await this.findOne({
    reviewerId,
    revieweeId,
    ...(requestId && { requestId }),
  });

  return !existingReview;
};

// Remove __v from JSON output
ReviewSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
