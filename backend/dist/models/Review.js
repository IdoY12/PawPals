"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const User_1 = __importDefault(require("./User"));
// Review schema
const ReviewSchema = new mongoose_1.Schema({
    reviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewer ID is required'],
        index: true,
    },
    revieweeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewee ID is required'],
        index: true,
    },
    requestId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Compound index to prevent duplicate reviews
ReviewSchema.index({ reviewerId: 1, revieweeId: 1, requestId: 1 }, { unique: true });
// Index for fetching reviews by reviewee
ReviewSchema.index({ revieweeId: 1, createdAt: -1 });
// Post-save hook to update user rating
ReviewSchema.post('save', async function (doc) {
    try {
        const user = await User_1.default.findById(doc.revieweeId);
        if (user) {
            await user.updateRating(doc.rating);
        }
    }
    catch (error) {
        console.error('Error updating user rating:', error);
    }
});
// Static method to get average rating for a user
ReviewSchema.statics.getAverageRating = async function (userId) {
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
ReviewSchema.statics.canReview = async function (reviewerId, revieweeId, requestId) {
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
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    },
});
exports.Review = mongoose_1.default.model('Review', ReviewSchema);
exports.default = exports.Review;
//# sourceMappingURL=Review.js.map