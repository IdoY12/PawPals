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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Message schema
const MessageSchema = new mongoose_1.Schema({
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender ID is required'],
        index: true,
    },
    receiverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Receiver ID is required'],
        index: true,
    },
    conversationId: {
        type: String,
        required: true,
        index: true,
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Compound index for fetching conversation messages
MessageSchema.index({ conversationId: 1, createdAt: -1 });
// Index for finding unread messages
MessageSchema.index({ receiverId: 1, isRead: 1 });
// Pre-save hook to generate conversationId
MessageSchema.pre('save', function (next) {
    if (!this.conversationId) {
        // Create consistent conversation ID from sorted user IDs
        const sortedIds = [this.senderId.toString(), this.receiverId.toString()].sort();
        this.conversationId = sortedIds.join('_');
    }
    next();
});
// Static method to generate conversation ID
MessageSchema.statics.generateConversationId = function (userId1, userId2) {
    const sortedIds = [userId1.toString(), userId2.toString()].sort();
    return sortedIds.join('_');
};
// Static method to get conversations for a user
MessageSchema.statics.getConversations = async function (userId) {
    const Message = this;
    const conversations = await Message.aggregate([
        {
            $match: {
                $or: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $group: {
                _id: '$conversationId',
                lastMessage: { $first: '$$ROOT' },
                messages: { $push: '$$ROOT' },
            },
        },
        {
            $addFields: {
                unreadCount: {
                    $size: {
                        $filter: {
                            input: '$messages',
                            as: 'msg',
                            cond: {
                                $and: [
                                    { $eq: ['$$msg.receiverId', userId] },
                                    { $eq: ['$$msg.isRead', false] },
                                ],
                            },
                        },
                    },
                },
                otherUserId: {
                    $cond: {
                        if: { $eq: ['$lastMessage.senderId', userId] },
                        then: '$lastMessage.receiverId',
                        else: '$lastMessage.senderId',
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'otherUserId',
                foreignField: '_id',
                as: 'otherUser',
            },
        },
        {
            $unwind: '$otherUser',
        },
        {
            $project: {
                conversationId: '$_id',
                lastMessage: 1,
                unreadCount: 1,
                otherUser: {
                    _id: 1,
                    name: 1,
                    profilePicture: 1,
                    userType: 1,
                },
            },
        },
        {
            $sort: { 'lastMessage.createdAt': -1 },
        },
    ]);
    return conversations;
};
// Static method to mark messages as read
MessageSchema.statics.markAsRead = async function (conversationId, userId) {
    await this.updateMany({
        conversationId,
        receiverId: userId,
        isRead: false,
    }, {
        $set: {
            isRead: true,
            readAt: new Date(),
        },
    });
};
// Remove __v from JSON output
MessageSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    },
});
exports.Message = mongoose_1.default.model('Message', MessageSchema);
exports.default = exports.Message;
//# sourceMappingURL=Message.js.map