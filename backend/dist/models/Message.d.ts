import mongoose, { Document, Model } from 'mongoose';
export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    conversationId: string;
    content: string;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IConversation {
    participantIds: mongoose.Types.ObjectId[];
    lastMessage: IMessage;
    unreadCount: number;
}
export declare const Message: Model<IMessage>;
export default Message;
//# sourceMappingURL=Message.d.ts.map