"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageResolvers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = require("../../models/Message");
const User_1 = require("../../models/User");
const validation_1 = require("../../utils/validation");
const apollo_1 = require("../../config/apollo");
// Subscription events
const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';
const NEW_MESSAGE_IN_CONVERSATION = 'NEW_MESSAGE_IN_CONVERSATION';
exports.messageResolvers = {
    Query: {
        // Get all conversations for current user
        getConversations: async (_, __, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            // Use aggregation to get conversations with last message and unread count
            const conversations = await Message_1.Message.aggregate([
                {
                    $match: {
                        $or: [
                            { senderId: user._id },
                            { receiverId: user._id },
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
                                            { $eq: ['$$msg.receiverId', user._id] },
                                            { $eq: ['$$msg.isRead', false] },
                                        ],
                                    },
                                },
                            },
                        },
                        otherUserId: {
                            $cond: {
                                if: { $eq: ['$lastMessage.senderId', user._id] },
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
        },
        // Get messages in a conversation
        getMessages: async (_, { userId, limit = 50, offset = 0 }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            // Generate conversation ID
            const sortedIds = [user._id.toString(), userId].sort();
            const conversationId = sortedIds.join('_');
            const messages = await Message_1.Message.find({ conversationId })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit);
            // Return in chronological order
            return messages.reverse();
        },
        // Get unread message count
        getUnreadCount: async (_, __, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const count = await Message_1.Message.countDocuments({
                receiverId: user._id,
                isRead: false,
            });
            return count;
        },
    },
    Mutation: {
        // Send a message
        sendMessage: async (_, { receiverId, content }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (!content.trim()) {
                (0, validation_1.throwValidationError)('Message content cannot be empty');
            }
            // Check if receiver exists
            const receiver = await User_1.User.findById(receiverId);
            if (!receiver) {
                (0, validation_1.throwNotFoundError)('Receiver');
            }
            // Generate conversation ID
            const sortedIds = [user._id.toString(), receiverId].sort();
            const conversationId = sortedIds.join('_');
            const message = new Message_1.Message({
                senderId: user._id,
                receiverId: new mongoose_1.default.Types.ObjectId(receiverId),
                conversationId,
                content: content.trim(),
                isRead: false,
            });
            await message.save();
            // Publish subscription events
            apollo_1.pubsub.publish(MESSAGE_RECEIVED, {
                messageReceived: message,
                receiverId,
            });
            apollo_1.pubsub.publish(`${NEW_MESSAGE_IN_CONVERSATION}_${conversationId}`, {
                newMessageInConversation: message,
            });
            return message;
        },
        // Mark messages as read
        markMessagesAsRead: async (_, { conversationId }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            await Message_1.Message.updateMany({
                conversationId,
                receiverId: user._id,
                isRead: false,
            }, {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
            return true;
        },
    },
    Subscription: {
        messageReceived: {
            subscribe: (_, __, { user }) => {
                if (!user)
                    (0, validation_1.throwAuthError)();
                return apollo_1.pubsub.asyncIterator([MESSAGE_RECEIVED]);
            },
            resolve: (payload, _, { user }) => {
                // Only deliver to the intended receiver
                if (payload.receiverId === user?._id.toString()) {
                    return payload.messageReceived;
                }
                return null;
            },
        },
        newMessageInConversation: {
            subscribe: (_, { conversationId }, { user }) => {
                if (!user)
                    (0, validation_1.throwAuthError)();
                return apollo_1.pubsub.asyncIterator([`${NEW_MESSAGE_IN_CONVERSATION}_${conversationId}`]);
            },
            resolve: (payload) => {
                return payload.newMessageInConversation;
            },
        },
    },
    // Field resolvers
    Message: {
        id: (parent) => parent._id.toString(),
        sender: async (parent) => {
            return User_1.User.findById(parent.senderId);
        },
        receiver: async (parent) => {
            return User_1.User.findById(parent.receiverId);
        },
    },
    Conversation: {
        otherUser: (parent) => ({
            id: parent.otherUser._id.toString(),
            ...parent.otherUser,
        }),
        lastMessage: (parent) => ({
            id: parent.lastMessage._id.toString(),
            ...parent.lastMessage,
        }),
    },
};
//# sourceMappingURL=message.js.map