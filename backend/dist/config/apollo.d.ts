import { ApolloServer } from '@apollo/server';
import { PubSub } from 'graphql-subscriptions';
import http from 'http';
import { IUser } from '../models/User';
export declare const pubsub: PubSub;
export interface GraphQLContext {
    user: IUser | null;
    pubsub: PubSub;
}
/**
 * Create and configure Apollo Server with WebSocket support
 */
export declare const createApolloServer: (httpServer: http.Server) => Promise<{
    server: ApolloServer<GraphQLContext>;
    schema: import("graphql").GraphQLSchema;
}>;
/**
 * Create context for each GraphQL request
 */
export declare const createContext: ({ req }: {
    req: any;
}) => Promise<GraphQLContext>;
//# sourceMappingURL=apollo.d.ts.map