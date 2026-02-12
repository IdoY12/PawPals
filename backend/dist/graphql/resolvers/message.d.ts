import mongoose from 'mongoose';
import { IMessage } from '../../models/Message';
import { GraphQLContext } from '../../config/apollo';
export declare const messageResolvers: {
    Query: {
        getConversations: (_: unknown, __: unknown, { user }: GraphQLContext) => Promise<any[]>;
        getMessages: (_: unknown, { userId, limit, offset }: {
            userId: string;
            limit?: number;
            offset?: number;
        }, { user }: GraphQLContext) => Promise<IMessage[]>;
        getUnreadCount: (_: unknown, __: unknown, { user }: GraphQLContext) => Promise<number>;
    };
    Mutation: {
        sendMessage: (_: unknown, { receiverId, content }: {
            receiverId: string;
            content: string;
        }, { user }: GraphQLContext) => Promise<IMessage>;
        markMessagesAsRead: (_: unknown, { conversationId }: {
            conversationId: string;
        }, { user }: GraphQLContext) => Promise<boolean>;
    };
    Subscription: {
        messageReceived: {
            subscribe: (_: unknown, __: unknown, { user }: GraphQLContext) => AsyncIterator<unknown, any, any>;
            resolve: (payload: {
                messageReceived: IMessage;
                receiverId: string;
            }, _: unknown, { user }: GraphQLContext) => IMessage | null;
        };
        newMessageInConversation: {
            subscribe: (_: unknown, { conversationId }: {
                conversationId: string;
            }, { user }: GraphQLContext) => AsyncIterator<unknown, any, any>;
            resolve: (payload: {
                newMessageInConversation: IMessage;
            }) => IMessage;
        };
    };
    Message: {
        id: (parent: IMessage) => string;
        sender: (parent: IMessage) => Promise<(mongoose.Document<unknown, {}, import("../../models/User").IUser, {}, {}> & import("../../models/User").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null>;
        receiver: (parent: IMessage) => Promise<(mongoose.Document<unknown, {}, import("../../models/User").IUser, {}, {}> & import("../../models/User").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null>;
    };
    Conversation: {
        otherUser: (parent: any) => any;
        lastMessage: (parent: any) => any;
    };
};
//# sourceMappingURL=message.d.ts.map