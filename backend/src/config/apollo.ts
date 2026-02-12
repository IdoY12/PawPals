import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import http from 'http';
import { typeDefs } from '../graphql/typeDefs';
import { resolvers } from '../graphql/resolvers';
import { verifyToken } from '../utils/jwt';
import { IUser } from '../models/User';

// Create PubSub instance for subscriptions
export const pubsub = new PubSub();

// Context type for GraphQL resolvers
export interface GraphQLContext {
  user: IUser | null;
  pubsub: PubSub;
}

/**
 * Create and configure Apollo Server with WebSocket support
 */
export const createApolloServer = async (httpServer: http.Server) => {
  // Create executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Set up WebSocket server with graphql-ws
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Get token from connection params
        const token = ctx.connectionParams?.authorization as string;
        let user = null;

        if (token) {
          try {
            const tokenValue = token.replace('Bearer ', '');
            user = await verifyToken(tokenValue);
          } catch (error) {
            console.error('WebSocket auth error:', error);
          }
        }

        return { user, pubsub };
      },
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      // Proper shutdown for HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  return { server, schema };
};

/**
 * Create context for each GraphQL request
 */
export const createContext = async ({ req }: { req: any }): Promise<GraphQLContext> => {
  const authHeader = req.headers.authorization || '';
  let user = null;

  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      user = await verifyToken(token);
    } catch (error) {
      // Token is invalid, user remains null
      console.error('Auth error:', error);
    }
  }

  return { user, pubsub };
};
