import mongoose from 'mongoose';
import { Message, IMessage } from '../../models/Message';
import { User } from '../../models/User';
import {
  throwAuthError,
  throwValidationError,
  throwNotFoundError,
} from '../../utils/validation';
import { GraphQLContext, pubsub } from '../../config/apollo';

// Subscription events
const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';
const NEW_MESSAGE_IN_CONVERSATION = 'NEW_MESSAGE_IN_CONVERSATION';

export const messageResolvers = {
  Query: {
    // Get all conversations for current user
    getConversations: async (
      _: unknown,
      __: unknown,
      { user }: GraphQLContext
    ): Promise<any[]> => {
      if (!user) return throwAuthError();

      // Use aggregation to get conversations with last message and unread count
      const conversations = await Message.aggregate([
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
    getMessages: async (
      _: unknown,
      { userId, limit = 50, offset = 0 }: { userId: string; limit?: number; offset?: number },
      { user }: GraphQLContext
    ): Promise<IMessage[]> => {
      if (!user) return throwAuthError();

      // Generate conversation ID
      const sortedIds = [user._id.toString(), userId].sort();
      const conversationId = sortedIds.join('_');

      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      // Return in chronological order
      return messages.reverse();
    },

    // Get unread message count
    getUnreadCount: async (
      _: unknown,
      __: unknown,
      { user }: GraphQLContext
    ): Promise<number> => {
      if (!user) return throwAuthError();

      const count = await Message.countDocuments({
        receiverId: user._id,
        isRead: false,
      });

      return count;
    },
  },

  Mutation: {
    // Send a message
    sendMessage: async (
      _: unknown,
      { receiverId, content }: { receiverId: string; content: string },
      { user }: GraphQLContext
    ): Promise<IMessage> => {
      if (!user) return throwAuthError();

      if (!content.trim()) {
        throwValidationError('Message content cannot be empty');
      }

      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        throwNotFoundError('Receiver');
      }

      // Generate conversation ID
      const sortedIds = [user._id.toString(), receiverId].sort();
      const conversationId = sortedIds.join('_');

      const message = new Message({
        senderId: user._id,
        receiverId: new mongoose.Types.ObjectId(receiverId),
        conversationId,
        content: content.trim(),
        isRead: false,
      });

      await message.save();

      // Publish subscription events
      pubsub.publish(MESSAGE_RECEIVED, {
        messageReceived: message,
        receiverId,
      });
      pubsub.publish(`${NEW_MESSAGE_IN_CONVERSATION}_${conversationId}`, {
        newMessageInConversation: message,
      });

      return message;
    },

    // Mark messages as read
    markMessagesAsRead: async (
      _: unknown,
      { conversationId }: { conversationId: string },
      { user }: GraphQLContext
    ): Promise<boolean> => {
      if (!user) return throwAuthError();

      await Message.updateMany(
        {
          conversationId,
          receiverId: user._id,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      return true;
    },
  },

  Subscription: {
    messageReceived: {
      subscribe: (_: unknown, __: unknown, { user }: GraphQLContext) => {
        if (!user) return throwAuthError();
        return pubsub.asyncIterator([MESSAGE_RECEIVED]);
      },
      resolve: (
        payload: { messageReceived: IMessage; receiverId: string },
        _: unknown,
        { user }: GraphQLContext
      ) => {
        // Only deliver to the intended receiver
        if (payload.receiverId === user?._id.toString()) {
          return payload.messageReceived;
        }
        return null;
      },
    },
    newMessageInConversation: {
      subscribe: (
        _: unknown,
        { conversationId }: { conversationId: string },
        { user }: GraphQLContext
      ) => {
        if (!user) return throwAuthError();
        return pubsub.asyncIterator([`${NEW_MESSAGE_IN_CONVERSATION}_${conversationId}`]);
      },
      resolve: (payload: { newMessageInConversation: IMessage }) => {
        return payload.newMessageInConversation;
      },
    },
  },

  // Field resolvers
  Message: {
    id: (parent: IMessage) => parent._id.toString(),
    sender: async (parent: IMessage) => {
      return User.findById(parent.senderId);
    },
    receiver: async (parent: IMessage) => {
      return User.findById(parent.receiverId);
    },
  },

  Conversation: {
    otherUser: (parent: any) => ({
      id: parent.otherUser._id.toString(),
      ...parent.otherUser,
    }),
    lastMessage: (parent: any) => ({
      id: parent.lastMessage._id.toString(),
      ...parent.lastMessage,
    }),
  },
};
