import mongoose, { Document, Schema, Model } from 'mongoose';

// Message document interface
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  conversationId: string; // Composite key for conversation lookup
  content: string;
  isRead: boolean;
  readAt?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Conversation summary interface (for chat list)
export interface IConversation {
  participantIds: mongoose.Types.ObjectId[];
  lastMessage: IMessage;
  unreadCount: number;
}

// Message schema
const MessageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound index for fetching conversation messages
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Index for finding unread messages
MessageSchema.index({ receiverId: 1, isRead: 1 });

// Pre-save hook to generate conversationId
MessageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    // Create consistent conversation ID from sorted user IDs
    const sortedIds = [this.senderId.toString(), this.receiverId.toString()].sort();
    this.conversationId = sortedIds.join('_');
  }
  next();
});

// Static method to generate conversation ID
MessageSchema.statics.generateConversationId = function(
  userId1: mongoose.Types.ObjectId | string,
  userId2: mongoose.Types.ObjectId | string
): string {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return sortedIds.join('_');
};

// Static method to get conversations for a user
MessageSchema.statics.getConversations = async function(
  userId: mongoose.Types.ObjectId
): Promise<any[]> {
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
MessageSchema.statics.markAsRead = async function(
  conversationId: string,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  await this.updateMany(
    {
      conversationId,
      receiverId: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Remove __v from JSON output
MessageSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
