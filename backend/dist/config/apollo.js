"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = exports.createApolloServer = exports.pubsub = void 0;
const server_1 = require("@apollo/server");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const schema_1 = require("@graphql-tools/schema");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const typeDefs_1 = require("../graphql/typeDefs");
const resolvers_1 = require("../graphql/resolvers");
const jwt_1 = require("../utils/jwt");
// Create PubSub instance for subscriptions
exports.pubsub = new graphql_subscriptions_1.PubSub();
/**
 * Create and configure Apollo Server with WebSocket support
 */
const createApolloServer = async (httpServer) => {
    // Create executable schema
    const schema = (0, schema_1.makeExecutableSchema)({ typeDefs: typeDefs_1.typeDefs, resolvers: resolvers_1.resolvers });
    // Create WebSocket server for subscriptions
    const wsServer = new ws_1.WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });
    // Set up WebSocket server with graphql-ws
    const serverCleanup = (0, ws_2.useServer)({
        schema,
        context: async (ctx) => {
            // Get token from connection params
            const token = ctx.connectionParams?.authorization;
            let user = null;
            if (token) {
                try {
                    const tokenValue = token.replace('Bearer ', '');
                    user = await (0, jwt_1.verifyToken)(tokenValue);
                }
                catch (error) {
                    console.error('WebSocket auth error:', error);
                }
            }
            return { user, pubsub: exports.pubsub };
        },
    }, wsServer);
    // Create Apollo Server
    const server = new server_1.ApolloServer({
        schema,
        plugins: [
            // Proper shutdown for HTTP server
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
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
exports.createApolloServer = createApolloServer;
/**
 * Create context for each GraphQL request
 */
const createContext = async ({ req }) => {
    const authHeader = req.headers.authorization || '';
    let user = null;
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            user = await (0, jwt_1.verifyToken)(token);
        }
        catch (error) {
            // Token is invalid, user remains null
            console.error('Auth error:', error);
        }
    }
    return { user, pubsub: exports.pubsub };
};
exports.createContext = createContext;
//# sourceMappingURL=apollo.js.map